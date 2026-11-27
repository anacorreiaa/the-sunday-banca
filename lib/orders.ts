// Orders in Notion ("Pedidos da revista impressa"): marking one as paid once Mercado Pago confirms it.
const NOTION_VERSION = '2025-09-03';
const UUID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

export const isOrderId = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);

/** Sets the order's Status to "Pago". Quietly does nothing when the id or the Notion token is missing. */
export async function markPaid(orderId: unknown) {
  if (!isOrderId(orderId) || !process.env.NOTION_API_TOKEN) return false;
  const res = await fetch(`https://api.notion.com/v1/pages/${orderId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${process.env.NOTION_API_TOKEN}`, 'Notion-Version': NOTION_VERSION, 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties: { Status: { status: { name: 'Pago' } } } }),
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });
  return res.ok;
}

const ORDERS = '41f4e3cc-c201-81fe-98ac-000b8bb3dbaf';

/**
 * For payments made through a plain Mercado Pago link (no order id attached):
 * finds the newest order with this e-mail that is still "Aguardando pagamento" and marks it "Pago".
 */
export async function markPaidByEmail(email: unknown) {
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email) || !process.env.NOTION_API_TOKEN) return false;
  const res = await fetch(`https://api.notion.com/v1/data_sources/${ORDERS}/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.NOTION_API_TOKEN}`, 'Notion-Version': NOTION_VERSION, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filter: { and: [
        { property: 'E-mail', email: { equals: email.trim().toLowerCase() } },
        { property: 'Status', status: { equals: 'Aguardando pagamento' } },
      ] },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: 1,
    }),
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });
  if (!res.ok) return false;
  const j = await res.json().catch(() => ({}));
  const id = j?.results?.[0]?.id;
  return id ? markPaid(id) : false;
}
