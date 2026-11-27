import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { plansNow } from '@/lib/promo';
import { markPaid, isOrderId } from '@/lib/orders';
import { siteUrl } from '@/lib/site';
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
 * Six and twelve months: one payment, card (up to 12x) or Pix.
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
      if (status === 'approved') await markPaid(order).catch(() => false);
      return json(200, { ok: true, kind: 'subscription', status, id: j.id });
    }

    const amount = Math.round(plan.amount * plan.cycles * 100) / 100;
    const title = `The Sunday Magazine · Assinatura ${plan.name.toLowerCase()}`;
    const address = { zip_code: zip, street_name: s(by.rua), street_number: s(by.numero, 20) };
    const body: Record<string, unknown> = {
      transaction_amount: amount,
      description: title,
      payment_method_id: fd.payment_method_id,
      payer: { ...payerIn, email, first_name: firstName || undefined, last_name: lastName || undefined },
      statement_descriptor: 'THE SUNDAY',
      external_reference: order || undefined,
      notification_url: `${siteUrl}/api/pagamento/aviso`,
      additional_info: {
        items: [{ id: plan.id, title, description: `${plan.cycles} edições da revista impressa`, category_id: 'others', quantity: 1, unit_price: amount }],
        payer: { first_name: firstName || '', last_name: lastName, phone: phone ? { area_code: phone.slice(0, 2), number: phone.slice(2) } : undefined, address },
        shipments: { receiver_address: { ...address, city_name: s(by.cidade), state_name: s(by.uf, 2) } },
      },
    };
    if (fd.payment_method_id !== 'pix') {
      if (!fd.token) return json(400, { ok: false });
      Object.assign(body, { token: fd.token, installments: Math.min(12, Math.max(1, Number(fd.installments) || 1)), issuer_id: fd.issuer_id });
    }
    const r = await fetch(`${MP}/v1/payments`, { method: 'POST', headers, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return json(402, { ok: false, status: 'rejected', detail: String(j?.cause?.[0]?.code || j?.message || '') });
    if (j.status === 'rejected') return json(200, { ok: false, status: 'rejected', detail: String(j.status_detail || ''), id: j.id });
    if (j.status === 'approved') await markPaid(order).catch(() => false);
    return json(200, { ok: true, kind: 'payment', status: String(j.status), detail: String(j.status_detail || ''), id: j.id });
  } catch {
    return json(502, { ok: false });
  }
}
