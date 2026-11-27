import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Tells the page whether payment on our own site is switched on (both Mercado Pago keys set in Vercel). */
export async function GET() {
  const publicKey = process.env.MP_PUBLIC_KEY || '';
  // MP_ONSITE=0 in Vercel switches it off again (back to the Mercado Pago links), without touching the code.
  const enabled = Boolean(publicKey && process.env.MP_ACCESS_TOKEN && process.env.MP_ONSITE !== '0');
  return NextResponse.json({ enabled, publicKey: enabled ? publicKey : '' }, { headers: { 'Cache-Control': 'no-store' } });
}

