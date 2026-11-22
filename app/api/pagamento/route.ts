import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import publication from '@/lib/publication.json';
import { trustedOrigin } from '../recommend/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (status: number, body: Record<string, unknown>) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const MP = 'https://api.mercadopago.com';

// The monthly plan is a Mercado Pago subscription plan; its id is in the plan's checkout address.
const planIdOf = (url: string) => { try { return new URL(url).searchParams.get('preapproval_plan_id') || ''; } catch { return ''; } };

/**
 * Charges the order on our own page. The price always comes from publication.json,
 * never from the browser. Monthly: card subscription. Six and twelve months: one payment (card or Pix).
 */
export async function POST(req: NextRequest) {
  if (!trustedOrigin(req)) return json(403, { ok: false });
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return json(503, { ok: false });
  let b: { plan?: string; email?: string; formData?: Record<string, unknown> };
  try { b = await req.json(); } catch { return json(400, { ok: false }); }
  const plan = publication.printPlans.find((p) => p.id === b.plan);
  const fd = b.formData || {};
  const payerIn = (fd.payer as Record<string, unknown>) || {};
  const email = String(payerIn.email || b.email || '').trim();
  if (!plan || !/^\S+@\S+\.\S+$/.test(email)) return json(400, { ok: false });

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': randomUUID() };

  try {
    if (plan.billing === 'monthly') {
      const preapproval_plan_id = planIdOf(plan.checkoutUrl);
      if (!preapproval_plan_id || !fd.token) return json(400, { ok: false });
      const r = await fetch(`${MP}/preapproval`, {
        method: 'POST', headers,
        body: JSON.stringify({ preapproval_plan_id, card_token_id: fd.token, payer_email: email, status: 'authorized' }),
      });
      const j = await r.json();
      if (!r.ok) return json(402, { ok: false, status: 'rejected', detail: j?.message || '' });
      return json(200, { ok: true, kind: 'subscription', status: j.status === 'authorized' ? 'approved' : String(j.status || 'pending'), id: j.id });
    }

    const amount = Math.round(plan.amount * plan.cycles * 100) / 100;
    const body: Record<string, unknown> = {
      transaction_amount: amount,
      description: `The Sunday Magazine · Assinatura ${plan.name.toLowerCase()}`,
      payment_method_id: fd.payment_method_id,
      payer: { ...payerIn, email },
      statement_descriptor: 'THE SUNDAY',
    };
    if (fd.payment_method_id !== 'pix') {
      if (!fd.token) return json(400, { ok: false });
      Object.assign(body, { token: fd.token, installments: Number(fd.installments) || 1, issuer_id: fd.issuer_id });
    }
    const r = await fetch(`${MP}/v1/payments`, { method: 'POST', headers, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) return json(402, { ok: false, status: 'rejected', detail: j?.message || '' });
    return json(200, { ok: true, kind: 'payment', status: String(j.status), detail: String(j.status_detail || ''), id: j.id });
  } catch {
    return json(502, { ok: false });
  }
}
