import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Tells the page whether payment on our own site is switched on (both Mercado Pago keys set in Vercel). */
export async function GET() {
  const publicKey = process.env.MP_PUBLIC_KEY || '';
  const enabled = Boolean(publicKey && process.env.MP_ACCESS_TOKEN);
  return NextResponse.json({ enabled, publicKey: enabled ? publicKey : '' }, { headers: { 'Cache-Control': 'no-store' } });
}
