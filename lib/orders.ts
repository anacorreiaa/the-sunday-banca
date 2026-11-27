// Orders in Notion ("Pedidos da revista impressa"): reading them, marking them paid or cancelled.
import { sendPaidEmail } from './mail';

const NOTION_VERSION = '2025-09-03';
export const ORDERS = '41f4e3cc-c201-81fe-98ac-000b8bb3dbaf';
const UUID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

export const isOrderId = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);

export type Order = {
  id: string; nome: string; email: string; plano: string; status: string; total: string;
  endereco: string; cep: string; whatsapp: string; mpId: string; created: string;
};

const api = async (path: string, method: string, body?: unknown) => {
  if (!process.env.NOTION_API_TOKEN) return null;
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.NOTION_API_TOKEN}`, 'Notion-Version': NOTION_VERSION, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });
  return res.ok ? res.json() : null;
};

const plain = (p: any) => (p?.title || p?.rich_text || []).map((t: any) => t.plain_text || '').join('');
const toOrder = (pg: any): Order => {
  const pr = pg?.properties || {};
  return {
    id: pg.id, nome: plain(pr.Nome), email: pr['E-mail']?.email || '', plano: pr.Plano?.select?.name || '',
    status: pr.Status?.status?.name || '', total: plain(pr.Total), endereco: plain(pr['Endereço']), cep: plain(pr.CEP),
    whatsapp: pr.WhatsApp?.phone_number || '', mpId: plain(pr['ID Mercado Pago']), created: pg.created_time || '',
  };
};

export async function getOrder(id: string) {
  if (!isOrderId(id)) return null;
  const pg = await api(`pages/${id}`, 'GET');
  return pg ? toOrder(pg) : null;
}

/** All orders for an e-mail, newest first. */
export async function ordersByEmail(email: string) {
  const j = await api(`data_sources/${ORDERS}/query`, 'POST', {
    filter: { property: 'E-mail', email: { equals: email.trim().toLowerCase() } },
    sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    page_size: 20,
  });
  return ((j?.results || []) as any[]).map(toOrder);
}

/** Saves the Mercado Pago id on the order (to find the subscription later, e.g. to cancel it). */
export async function setMpId(orderId: unknown, mpId: unknown) {
  if (!isOrderId(orderId) || !mpId) return false;
  return !!(await api(`pages/${orderId}`, 'PATCH', { properties: { 'ID Mercado Pago': { rich_text: [{ type: 'text', text: { content: String(mpId).slice(0, 100) } }] } } }));
}

/**
 * Sets the order's Status to "Pago" and, the first time it happens, e-mails the subscriber.
 * Quietly does nothing when the id or the Notion token is missing.
 */
export async function markPaid(orderId: unknown, mpId?: unknown) {
  if (!isOrderId(orderId)) return false;
  const before = await getOrder(orderId);
  if (!before) return false;
  if (mpId && !before.mpId) await setMpId(orderId, mpId);
  if (before.status === 'Pago' || before.status === 'Enviado') return true;
  const ok = !!(await api(`pages/${orderId}`, 'PATCH', { properties: { Status: { status: { name: 'Pago' } } } }));
  if (ok) await sendPaidEmail(before).catch(() => false);
  return ok;
}

export async function markCancelled(orderId: string) {
  return !!(await api(`pages/${orderId}`, 'PATCH', { properties: { Status: { status: { name: 'Cancelado' } } } }));
}

/**
 * For payments made through a plain Mercado Pago link (no order id attached):
 * finds the newest order with this e-mail that is still "Aguardando pagamento" and marks it "Pago".
 */
export async function markPaidByEmail(email: unknown, mpId?: unknown) {
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) return false;
  const waiting = (await ordersByEmail(email)).find((o) => o.status === 'Aguardando pagamento');
  return waiting ? markPaid(waiting.id, mpId) : false;
}
