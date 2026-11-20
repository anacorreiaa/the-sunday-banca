import { publicHosts } from '@/lib/site';
import { NextResponse, type NextRequest } from 'next/server';
import { alreadyDelivered, clientHash, deliver, isConfigured, RATE_LIMIT, recentCount, validate, notifyByEmail } from '@/lib/recommend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 8 * 1024;

const json = (status: number, body: Record<string, unknown>) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/** The browser's Origin must be the public site (SITE_URL) or the host serving this request. */
function trustedOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const allowed = new Set<string>(publicHosts);
  if (process.env.SITE_URL) {
    try { allowed.add(new URL(process.env.SITE_URL).host); } catch {}
  }
  // On Vercel these are set by the platform, not the client.
  for (const h of [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) if (h) allowed.add(h);
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (host && process.env.NODE_ENV !== 'production') allowed.add(host);
  return allowed.has(originHost);
}

/** Only headers set by the trusted host. On Vercel, x-real-ip / x-vercel-forwarded-for are platform-set. */
function clientIp(req: NextRequest) {
  if (process.env.VERCEL) return req.headers.get('x-real-ip') || req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || null;
  return null;
}

export async function POST(req: NextRequest) {
  if (!isConfigured()) return json(503, { ok: false, error: 'not_configured' });
  if (!trustedOrigin(req)) return json(403, { ok: false, error: 'forbidden' });
  if (!(req.headers.get('content-type') || '').includes('application/json')) return json(415, { ok: false, error: 'invalid' });

  const len = Number(req.headers.get('content-length') || 0);
  if (len > MAX_BODY_BYTES) return json(413, { ok: false, error: 'too_long' });
  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return json(413, { ok: false, error: 'too_long' });
    body = JSON.parse(text);
  } catch {
    return json(400, { ok: false, error: 'invalid' });
  }

  const v = validate(body);
  if (!v.ok) return json(400, { ok: false, error: v.error });
  if (v.honeypot) return json(200, { ok: true }); // bots get a quiet no-op

  try {
    if (await alreadyDelivered(v.id)) return json(200, { ok: true, duplicate: true });
    const hash = clientHash(clientIp(req));
    if (hash && (await recentCount(hash)) >= RATE_LIMIT) return json(429, { ok: false, error: 'rate_limited' });
    await deliver(v.id, v.message, hash);
    await notifyByEmail(v.message);
    return json(200, { ok: true });
  } catch (err) {
    console.error('[recommend] delivery failed:', (err as Error).message);
    return json(502, { ok: false, error: 'delivery_failed' });
  }
}
