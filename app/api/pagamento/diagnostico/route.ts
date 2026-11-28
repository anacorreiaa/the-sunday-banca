import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Temporary: why recent Mercado Pago charges were refused. Only statuses, no personal data.
export async function GET() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ ok: false });
  const h = { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' as const };
  const p = await fetch('https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=25', h).then((r) => r.json()).catch(() => ({}));
  const payments = (p?.results || []).map((x: any) => ({
    when: x.date_created, status: x.status, detail: x.status_detail, amount: x.transaction_amount,
    method: x.payment_method_id, type: x.payment_type_id, op: x.operation_type, desc: String(x.description || '').slice(0, 60),
    three_ds: x.three_ds_info?.status || null, device: !!x.additional_info?.ip_address, installments: x.installments,
  }));
  return NextResponse.json({ payments }, { headers: { 'Cache-Control': 'no-store' } });
}
