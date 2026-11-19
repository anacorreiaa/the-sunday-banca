// Server-only validation and delivery of reader suggestions to the owner's private Notion data source.
import 'server-only';
import { createHmac } from 'node:crypto';

const NOTION_VERSION = '2025-09-03';
const NOTION_TIMEOUT_MS = 8000;
export const MAX_MESSAGE = 2000;
const MAX_PER_HOUR = 5;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isConfigured() {
  return Boolean(process.env.NOTION_API_TOKEN && process.env.NOTION_DATA_SOURCE_ID);
}

export type Validated = { ok: true; id: string; message: string; honeypot: boolean } | { ok: false; error: string };

export function validate(body: unknown): Validated {
  if (!body || typeof body !== 'object') return { ok: false, error: 'invalid' };
  const b = body as Record<string, unknown>;
  const id = typeof b.id === 'string' ? b.id : '';
  const message = typeof b.message === 'string' ? b.message.replace(/\r\n/g, '\n').trim() : '';
  if (!UUID_RE.test(id)) return { ok: false, error: 'invalid' };
  if (!message) return { ok: false, error: 'empty' };
  if (message.length > MAX_MESSAGE) return { ok: false, error: 'too_long' };
  const honeypot = typeof b.website === 'string' && b.website.trim() !== '';
  return { ok: true, id, message, honeypot };
}

/** Pseudonymous, keyed hash of the client address. The raw address is never stored or logged. */
export function clientHash(ip: string | null) {
  if (!ip) return null;
  const key = process.env.RATE_LIMIT_SECRET || process.env.NOTION_API_TOKEN || '';
  return createHmac('sha256', key).update(ip).digest('hex').slice(0, 32);
}

/** Short title for the Notion row. */
export function titleFrom(message: string) {
  const first = message.split('\n')[0].trim();
  return first.length > 80 ? `${first.slice(0, 79).trimEnd()}…` : first;
}

async function notion(path: string, body: unknown) {
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NOTION_API_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(NOTION_TIMEOUT_MS),
    cache: 'no-store',
  });
  if (!res.ok) {
    // Status only: Notion error bodies can echo request content.
    throw new Error(`Notion ${path.split('/')[0]} failed with ${res.status}`);
  }
  return res.json();
}

const ds = () => process.env.NOTION_DATA_SOURCE_ID as string;

export async function alreadyDelivered(id: string) {
  const r = await notion(`data_sources/${ds()}/query`, {
    filter: { property: 'Submission ID', rich_text: { equals: id } },
    page_size: 1,
  });
  return Array.isArray(r.results) && r.results.length > 0;
}

export async function recentCount(hash: string) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const r = await notion(`data_sources/${ds()}/query`, {
    filter: {
      and: [
        { property: 'Client Hash', rich_text: { equals: hash } },
        { timestamp: 'created_time', created_time: { on_or_after: since } },
      ],
    },
    page_size: MAX_PER_HOUR + 1,
  });
  return Array.isArray(r.results) ? r.results.length : 0;
}

export const RATE_LIMIT = MAX_PER_HOUR;

/** Notion rich text items are capped at 2000 chars each; split to be safe. */
function richText(text: string) {
  const parts = [];
  for (let i = 0; i < text.length; i += 1900) parts.push({ type: 'text', text: { content: text.slice(i, i + 1900) } });
  return parts;
}

export async function deliver(id: string, message: string, hash: string | null) {
  await notion('pages', {
    parent: { type: 'data_source_id', data_source_id: ds() },
    properties: {
      Suggestion: { title: richText(titleFrom(message)) },
      Message: { rich_text: richText(message) },
      Status: { select: { name: 'New' } },
      'Submission ID': { rich_text: richText(id) },
      ...(hash ? { 'Client Hash': { rich_text: richText(hash) } } : {}),
    },
  });
}

/** Optional: also email each suggestion (Resend). Needs RESEND_API_KEY and NOTIFY_EMAIL; a failure never loses the suggestion. */
export async function notifyByEmail(message: string) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return;
  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || 'The Sunday <onboarding@resend.dev>',
        to: to.split(',').map((x) => x.trim()).filter(Boolean),
        subject: `Novo post-it no mural: ${titleFrom(message)}`,
        text: `Alguém deixou um post-it no mural do site:\n\n${message}\n\n(Também está salvo na tabela de sugestões do Notion.)`,
        html: `<p style="font-family:Georgia,serif;color:#3b2a20">Alguém deixou um post-it no mural do site:</p><blockquote style="font-family:Georgia,serif;font-size:17px;color:#3b2a20;background:#efe6d6;padding:16px 20px;border-left:3px solid #4e5d68;white-space:pre-wrap">${esc(message)}</blockquote><p style="font-family:Arial,sans-serif;font-size:12px;color:#7d6b58">Também está salvo na tabela de sugestões do Notion.</p>`,
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) console.error('[recommend] email failed:', res.status);
  } catch (err) {
    console.error('[recommend] email failed:', (err as Error).message);
  }
}
