import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, readToken } from '@/lib/session';
import { getOrder, markCancelled, setMpId } from '@/lib/orders';
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
  if (!token) return json(409, { ok: false, reason: 'manual' });
  const auth = { Authorization: `Bearer ${token}` };
  // Older orders don't have the subscription number saved: look it up by the order, then by her e-mail.
  let mpId = /^[0-9a-f]{20,40}$/i.test(o.mpId) ? o.mpId : '';
  if (!mpId) {
    for (const q of [`external_reference=${encodeURIComponent(o.id)}`, `payer_email=${encodeURIComponent(email)}&status=authorized`]) {
      const s = await fetch(`https://api.mercadopago.com/preapproval/search?${q}`, { headers: auth, cache: 'no-store' }).then((r) => r.json()).catch(() => ({}));
      const hit = ((s?.results || []) as Array<{ id: string; status: string; date_created?: string }>)
        .filter((x) => x.status === 'authorized' || x.status === 'pending')
        .sort((a, b) => String(b.date_created || '').localeCompare(String(a.date_created || '')))[0];
      if (hit?.id) { mpId = hit.id; break; }
    }
    if (!mpId) return json(409, { ok: false, reason: 'manual' });
    await setMpId(o.id, mpId).catch(() => false);
  }
  const r = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(mpId)}`, {
    method: 'PUT',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'cancelled' }),
  });
  if (!r.ok) return json(409, { ok: false, reason: 'manual' });
  await markCancelled(o.id);
  return json(200, { ok: true });
}
