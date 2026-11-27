// Subscriber sign-in without passwords: a signed, expiring token sent by e-mail, then kept in a cookie.
import { createHmac, timingSafeEqual } from 'crypto';

export const COOKIE = 'ts_conta';
const key = () => process.env.SESSION_SECRET || process.env.NOTION_API_TOKEN || '';
const b64 = (s: string) => Buffer.from(s).toString('base64url');
const sign = (data: string) => createHmac('sha256', key()).update(data).digest('base64url');

/** A token for this e-mail, valid for the given number of minutes. */
export function makeToken(email: string, minutes: number) {
  const data = b64(JSON.stringify({ e: email.trim().toLowerCase(), x: Date.now() + minutes * 60_000 }));
  return `${data}.${sign(data)}`;
}

/** The e-mail inside a valid, unexpired token, or null. */
export function readToken(token: string | undefined | null) {
  if (!token || !key()) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const good = sign(data);
  if (good.length !== sig.length || !timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return null;
  try {
    const { e, x } = JSON.parse(Buffer.from(data, 'base64url').toString());
    return typeof e === 'string' && typeof x === 'number' && x > Date.now() ? e : null;
  } catch {
    return null;
  }
}
