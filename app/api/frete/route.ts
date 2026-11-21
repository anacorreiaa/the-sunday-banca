import { NextResponse } from 'next/server';
import { quote } from '@/lib/frete';

// Returns only the shipping price. Who delivers stays on the server.
export async function GET(req: Request) {
  const cep = new URL(req.url).searchParams.get('cep') || '';
  const q = await quote(cep);
  if (!q.ok) return NextResponse.json({ ok: false, reason: q.reason });
  return NextResponse.json({ ok: true, price: q.price });
}
