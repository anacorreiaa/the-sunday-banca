import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Says only whether the Mercado Pago key in Vercel works. Never returns the key or account details. */
export async function GET() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ ok: false, why: 'sem chave' });
  try {
    const r = await fetch('https://api.mercadopago.com/v1/payment_methods', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    return NextResponse.json({ ok: r.ok, status: r.status }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ ok: false, why: 'sem resposta' });
  }
}
