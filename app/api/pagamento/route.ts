import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { plansNow } from '@/lib/promo';
import { markPaid, isOrderId, setMpId } from '@/lib/orders';
import { trustedOrigin } from '../recommend/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (status: number, body: Record<string, unknown>) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const MP = 'https://api.mercadopago.com';
const s = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// The monthly plans are Mercado Pago subscription plans; the id is in the plan's checkout address.
const planIdOf = (url: string) => { try { return new URL(url).searchParams.get('preapproval_plan_id') || ''; } catch { return ''; } };

/**
 * Charges the order on our own page. The price always comes from our plans, never from the browser.
 * Monthly: card subscription on the plan's Mercado Pago subscription plan.
 * Six and twelve months: one order, card (up to 12x) or Pix.
 * Everything we know about the buyer goes with it, because that is what Mercado Pago's fraud check uses.
 */
export async function POST(req: NextRequest) {
  if (!trustedOrigin(req)) return json(403, { ok: false });
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return json(503, { ok: false });
  let b: { plan?: string; email?: string; order?: string; deviceId?: string; buyer?: Record<string, unknown>; formData?: Record<string, unknown> };
  try { b = await req.json(); } catch { return json(400, { ok: false }); }
  const plan = plansNow().find((p) => p.id === b.plan);
  const fd = b.formData || {};
  const payerIn = (fd.payer as Record<string, unknown>) || {};
  const email = s(payerIn.email, 160) || s(b.email, 160);
  if (!plan || !/^\S+@\S+\.\S+$/.test(email)) return json(400, { ok: false });

  const by = b.buyer || {};
  const [firstName, ...rest] = s(by.nome).split(/\s+/);
  const lastName = rest.join(' ');
  const phone = s(by.whatsapp, 30).replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  const zip = s(by.cep, 12).replace(/\D/g, '');
  const order = isOrderId(b.order) ? b.order : '';
  const deviceId = s(b.deviceId, 200);

  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': randomUUID() };
  if (deviceId) headers['X-meli-session-id'] = deviceId;

  try {
    if (plan.billing === 'monthly') {
      const preapproval_plan_id = planIdOf(plan.checkoutUrl);
      if (!preapproval_plan_id || !fd.token) return json(400, { ok: false });
      const r = await fetch(`${MP}/preapproval`, {
        method: 'POST', headers,
        body: JSON.stringify({ preapproval_plan_id, card_token_id: fd.token, payer_email: email, external_reference: order || undefined, status: 'authorized' }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return json(402, { ok: false, status: 'rejected', detail: String(j?.cause?.[0]?.code || j?.message || '') });
      const status = j.status === 'authorized' ? 'approved' : String(j.status || 'pending');
      if (status === 'approved') await markPaid(order, j.id).catch(() => false);
      else await setMpId(order, j.id).catch(() => false);
      return json(200, { ok: true, kind: 'subscription', status, id: j.id });
    }

    // Six and twelve months: one order (Mercado Pago "Orders" API), card up to 12x or Pix.
    const amount = (Math.round(plan.amount * plan.cycles * 100) / 100).toFixed(2);
    const title = `The Sunday Magazine · Assinatura ${plan.name.toLowerCase()}`;
    const ident = (payerIn.identification as Record<string, unknown>) || {};
    const address = { zip_code: zip, street_name: s(by.rua), street_number: s(by.numero, 20), neighborhood: s(by.bairro, 80), city: s(by.cidade, 80), state: s(by.uf, 2).toUpperCase(), complement: s(by.complemento, 80) || undefined };
    const pix = fd.payment_method_id === 'pix';
    if (!pix && !fd.token) return json(400, { ok: false });
    const body: Record<string, unknown> = {
      type: 'online',
      processing_mode: 'automatic',
      total_amount: amount,
      external_reference: order || `site-${Date.now()}`,
      description: title,
      payer: {
        email,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        identification: ident.number ? { type: s(ident.type, 10) || 'CPF', number: s(ident.number, 20).replace(/\D/g, '') } : undefined,
        phone: phone ? { area_code: phone.slice(0, 2), number: phone.slice(2) } : undefined,
        address,
      },
      shipment: { address },
      items: [{ title, description: `${plan.cycles} edições da revista impressa`, category_id: 'others', quantity: 1, unit_price: amount, external_code: plan.id }],
      transactions: {
        payments: [{
          amount,
          payment_method: pix
            ? { id: 'pix', type: 'bank_transfer' }
            : { id: s(fd.payment_method_id, 30), type: s(fd.payment_type_id, 30) || 'credit_card', token: s(fd.token, 64), installments: Math.min(12, Math.max(1, Number(fd.installments) || 1)) },
        }],
      },
    };
    const r = await fetch(`${MP}/v1/orders`, { method: 'POST', headers, body: JSON.stringify(body) });
    const raw = await r.text();
    let j: Record<string, any> = {};
    try { j = JSON.parse(raw); } catch {}
    const pay = j?.transactions?.payments?.[0] || {};
    const reason = (raw.match(/(cc_rejected_[a-z_]+|rejected_[a-z_]+|high_risk|insufficient_amount)/) || [''])[0];
    if (!r.ok || pay.status === 'failed' || pay.status === 'rejected') return json(402, { ok: false, status: 'rejected', detail: reason || String(pay.status_detail || '') });
    const detail = String(j.status_detail || pay.status_detail || '');
    await setMpId(order, j.id).catch(() => false);
    if (j.status === 'processed' && detail === 'accredited') {
      await markPaid(order, j.id).catch(() => false);
      return json(200, { ok: true, kind: 'order', status: 'approved', id: j.id });
    }
    if (pix) {
      const pm = pay.payment_method || {};
      return json(200, { ok: true, kind: 'order', status: 'pending', id: j.id, pix: { code: String(pm.qr_code || ''), image: String(pm.qr_code_base64 || ''), url: String(pm.ticket_url || '') } });
    }
    return json(200, { ok: true, kind: 'order', status: 'in_process', detail, id: j.id });
  } catch {
    return json(502, { ok: false });
  }
}
