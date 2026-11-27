import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Tells the page whether payment on our own site is switched on (both Mercado Pago keys set in Vercel). */
export async function GET() {
  const publicKey = process.env.MP_PUBLIC_KEY || '';
  // On the live site, paying on our page also needs MP_ONSITE=1, so it can be tried on the test version first.
  const live = process.env.VERCEL_ENV === 'production';
  const enabled = Boolean(publicKey && process.env.MP_ACCESS_TOKEN && (!live || process.env.MP_ONSITE === '1'));
  return NextResponse.json({ enabled, publicKey: enabled ? publicKey : '' }, { headers: { 'Cache-Control': 'no-store' } });
}
