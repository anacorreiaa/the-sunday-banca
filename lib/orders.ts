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
