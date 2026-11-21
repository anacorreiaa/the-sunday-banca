import { NextResponse, type NextRequest } from 'next/server';
import publication from '@/lib/publication.json';
import { notion } from '@/lib/recommend';
import { quote } from '@/lib/frete';
import { trustedOrigin } from '../recommend/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// "Pedidos da revista impressa" in Notion. An id, not a secret: writing needs the site's Notion token.
const ORDERS = '41f4e3cc-c201-81fe-98ac-000b8bb3dbaf';

const json = (status: number, body: Record<string, unknown>) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const text = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const rt = (content: string) => ({ rich_text: content ? [{ type: 'text', text: { content } }] : [] });
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Saves the order in Notion; the browser then goes to the plan's Mercado Pago link. */
export async function POST(req: NextRequest) {
  if (!trustedOrigin(req)) return json(403, { ok: false });
  if (!process.env.NOTION_API_TOKEN) return json(503, { ok: false });
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json(400, { ok: false }); }
  if (text(b.website)) return json(200, { ok: true }); // a bot filled the hidden field

  const plan = publication.printPlans.find((p) => p.id === b.plan);
  const nome = text(b.nome, 120), email = text(b.email, 160), whatsapp = text(b.whatsapp, 30), cep = text(b.cep, 12);
  const rua = text(b.rua), numero = text(b.numero, 20), complemento = text(b.complemento, 80), bairro = text(b.bairro, 80), cidade = text(b.cidade, 80), uf = text(b.uf, 2);
  if (!plan || !nome || !/^\S+@\S+\.\S+$/.test(email) || !whatsapp || !rua || !numero || cep.replace(/\D/g, '').length !== 8) return json(400, { ok: false });

  const q = await quote(cep);
  if (!q.ok) return json(400, { ok: false, reason: q.reason });

  const frete = plan.freeShipping ? 0 : publication.shipping.fixed;
  const total = plan.billing === 'monthly' ? `${brl(plan.amount + frete)} por mês` : brl(plan.amount * plan.cycles);
  const endereco = `${rua}, ${numero}${complemento ? ` (${complemento})` : ''} · ${bairro} · ${cidade}/${uf}`;

  try {
    await notion('pages', {
      parent: { type: 'data_source_id', data_source_id: ORDERS },
      properties: {
        Nome: { title: [{ type: 'text', text: { content: nome } }] },
        Plano: { select: { name: plan.name } },
        Total: rt(total),
        'Quem entrega': { select: { name: q.from } },
        'E-mail': { email },
        WhatsApp: { phone_number: whatsapp },
        Endereço: rt(endereco),
        CEP: rt(cep),
      },
    });
  } catch {
    return json(502, { ok: false });
  }
  return json(200, { ok: true });
}
