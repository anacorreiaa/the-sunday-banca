import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, readToken } from '@/lib/session';
import { getOrder, markCancelled } from '@/lib/orders';
import { trustedOrigin } from '../../recommend/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Cancels a monthly subscription in Mercado Pago, only for the signed-in subscriber's own order. */
export async function POST(req: NextRequest) {
  const json = (status: number, body: Record<string, unknown>) => NextResponse.json(body, { status });
  if (!trustedOrigin(req)) return json(403, { ok: false });
  const email = readToken(req.cookies.get(COOKIE)?.value);
  if (!email) return json(401, { ok: false });
  let id = '';
  try { id = String((await req.json())?.order || ''); } catch {}
  const o = await getOrder(id);
  if (!o || o.email.toLowerCase() !== email || o.plano !== 'Mensal' || o.status === 'Cancelado') return json(400, { ok: false });
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token || !o.mpId) return json(409, { ok: false, reason: 'manual' });
  const r = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(o.mpId)}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'cancelled' }),
  });
  if (!r.ok) return json(409, { ok: false, reason: 'manual' });
  await markCancelled(o.id);
  return json(200, { ok: true });
}
