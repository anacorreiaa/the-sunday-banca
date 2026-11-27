// Orders in Notion ("Pedidos da revista impressa"): reading them, marking them paid or cancelled.
import { sendPaidEmail } from './mail';
import publication from './publication.json';

const NOTION_VERSION = '2025-09-03';
export const ORDERS = '41f4e3cc-c201-81fe-98ac-000b8bb3dbaf';
const UUID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

export const isOrderId = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);

export type Order = {
  id: string; nome: string; email: string; plano: string; status: string; total: string;
  endereco: string; cep: string; whatsapp: string; mpId: string; created: string;
  primeira: string; recebeAte: string; ultima: string;
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
    primeira: pr['Primeira edição']?.date?.start || '', recebeAte: pr['Recebe até']?.date?.start || '', ultima: pr['Última enviada']?.date?.start || '',
  };
};

/** First day of the month, n months after the given YYYY-MM-DD. */
export const addMonths = (iso: string, n: number) => {
  const [y, m] = iso.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 10);
};
const cyclesOf = (plano: string) => (plano === 'Anual' ? 12 : plano === 'Semestral' ? 6 : 1);
/** The edition a new subscriber gets first: the upcoming one, or this month's if it is later. */
export const currentEdition = () => {
  const now = new Date().toISOString().slice(0, 7) + '-01';
  return publication.nextEdition.date > now ? publication.nextEdition.date : now;
};
const date = (iso: string) => ({ date: { start: iso } });

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
  if (before.status === 'Ativa' || before.status === 'Cancelada') return true;
  const first = before.primeira || currentEdition();
  const ok = !!(await api(`pages/${orderId}`, 'PATCH', { properties: {
    Status: { status: { name: 'Ativa' } },
    'Primeira edição': date(first),
    'Recebe até': date(before.recebeAte || addMonths(first, cyclesOf(before.plano) - 1)),
  } }));
  if (ok) await sendPaidEmail(before, first).catch(() => false);
  return ok;
}

export async function markCancelled(orderId: string) {
  return !!(await api(`pages/${orderId}`, 'PATCH', { properties: { Status: { status: { name: 'Cancelada' } } } }));
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

/** The order that holds this Mercado Pago subscription. */
export async function orderByMpId(mpId: string) {
  const j = await api(`data_sources/${ORDERS}/query`, 'POST', { filter: { property: 'ID Mercado Pago', rich_text: { equals: mpId } }, page_size: 1 });
  const pg = j?.results?.[0];
  return pg ? toOrder(pg) : null;
}

/** A monthly renewal was paid: she gets one more edition. */
export async function extendOneMonth(o: Order) {
  if (o.plano !== 'Mensal' || !o.recebeAte) return false;
  const next = addMonths(o.recebeAte, 1);
  const target = next > currentEdition() ? next : currentEdition();
  return !!(await api(`pages/${o.id}`, 'PATCH', { properties: { 'Recebe até': date(target) } }));
}
