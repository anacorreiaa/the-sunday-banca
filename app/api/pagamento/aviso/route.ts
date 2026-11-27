import { NextResponse, type NextRequest } from 'next/server';
import { markPaid, markPaidByEmail, isOrderId } from '@/lib/orders';

const settle = async (ref: unknown, email: unknown, mpId?: unknown) => (isOrderId(ref) ? markPaid(ref, mpId) : markPaidByEmail(email, mpId));

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MP = 'https://api.mercadopago.com';
const ok = () => NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });

/**
 * Mercado Pago calls this when a payment changes (a Pix being paid, for example).
 * We never trust the call itself: we ask Mercado Pago for the payment with our own key,
 * and only an approved payment marks its order as "Pago" in Notion.
 */
export async function POST(req: NextRequest) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return ok();
  const url = new URL(req.url);
  let body: { type?: string; action?: string; data?: { id?: string | number } } = {};
  try { body = await req.json(); } catch {}
  const type = body.type || url.searchParams.get('type') || url.searchParams.get('topic') || '';
  const id = String(body.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id') || '');
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(id)) return ok();

  try {
    const auth = { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' as const };
    if (type === 'order') {
      const r = await fetch(`${MP}/v1/orders/${id}`, auth);
      const o = await r.json().catch(() => ({}));
      if (o?.status === 'processed' && o?.status_detail === 'accredited') await settle(o.external_reference, o?.payer?.email, o.id);
    } else if (type === 'payment') {
      const r = await fetch(`${MP}/v1/payments/${id}`, auth);
      const p = await r.json().catch(() => ({}));
      if (p?.status === 'approved') await settle(p.external_reference, p?.payer?.email, p.id);
    } else if (type === 'subscription_preapproval') {
      const r = await fetch(`${MP}/preapproval/${id}`, auth);
      const p = await r.json().catch(() => ({}));
      if (p?.status === 'authorized') await settle(p.external_reference, p?.payer_email, p.id);
    }
  } catch {}
  return ok();
}

export const GET = ok;
