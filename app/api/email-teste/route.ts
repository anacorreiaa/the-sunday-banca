import { NextResponse } from 'next/server';
import { sendPaidEmail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

// Temporary: sends a sample confirmation only to Ana's own address.
export async function POST() {
  const ok = await sendPaidEmail({ nome: 'Ana Luiza', email: 'analuizacorreiasc@gmail.com', plano: 'Mensal', total: 'R$ 69,90 por mês' }, '2026-12-01');
  return NextResponse.json({ ok });
}
