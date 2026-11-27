import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE } from '@/lib/session';

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/minha-assinatura', req.url), 303);
  res.cookies.delete(COOKIE);
  return res;
}
