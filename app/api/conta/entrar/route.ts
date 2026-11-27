import { NextResponse, type NextRequest } from 'next/server';
import { ordersByEmail } from '@/lib/orders';
import { makeToken } from '@/lib/session';
import { sendLoginEmail } from '@/lib/mail';
import { siteUrl } from '@/lib/site';
import { trustedOrigin } from '../../recommend/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Sends the sign-in link. Always answers the same way, so nobody can test which e-mails are subscribers. */
export async function POST(req: NextRequest) {
  if (!trustedOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });
  let email = '';
  try { email = String((await req.json())?.email || '').trim().toLowerCase().slice(0, 160); } catch {}
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ ok: false }, { status: 400 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: false, reason: 'mail' }, { status: 503 });
  try {
    const orders = await ordersByEmail(email);
    if (orders.length) await sendLoginEmail(email, `${siteUrl}/api/conta/sessao?t=${encodeURIComponent(makeToken(email, 60))}`);
  } catch {}
  return NextResponse.json({ ok: true });
}
