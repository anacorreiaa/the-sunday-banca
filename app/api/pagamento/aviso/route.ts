import { NextResponse, type NextRequest } from 'next/server';
import { markPaid } from '@/lib/orders';

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
  if (!/^\d{1,20}$/.test(id) && !/^[0-9a-f]{20,40}$/i.test(id)) return ok();

  try {
    const auth = { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' as const };
    if (type === 'payment') {
      const r = await fetch(`${MP}/v1/payments/${id}`, auth);
      const p = await r.json().catch(() => ({}));
      if (p?.status === 'approved') await markPaid(p.external_reference);
    } else if (type === 'subscription_preapproval') {
      const r = await fetch(`${MP}/preapproval/${id}`, auth);
      const p = await r.json().catch(() => ({}));
      if (p?.status === 'authorized') await markPaid(p.external_reference);
    }
  } catch {}
  return ok();
}

export const GET = ok;
