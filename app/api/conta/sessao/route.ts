import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, makeToken, readToken } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Opens the subscriber area from the e-mailed link and keeps her signed in for 30 days. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = readToken(url.searchParams.get('t'));
  const res = NextResponse.redirect(new URL(email ? '/minha-assinatura' : '/minha-assinatura?expirou=1', url));
  if (email) res.cookies.set(COOKIE, makeToken(email, 60 * 24 * 30), { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
  return res;
}
