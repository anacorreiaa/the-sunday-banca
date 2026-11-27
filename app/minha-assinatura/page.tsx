import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import AccountLogin from '@/components/AccountLogin';
import CancelButton from '@/components/CancelButton';
import publication from '@/lib/publication.json';
import { COOKIE, readToken } from '@/lib/session';
import { ordersByEmail, type Order } from '@/lib/orders';

export const metadata: Metadata = { title: 'Minha assinatura', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const WA = 'https://wa.me/5581992300380';
const since = (iso: string) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }) : '');
const editions = (plano: string) => (plano === 'Anual' ? '12 edições' : plano === 'Semestral' ? '6 edições' : 'Uma revista por mês');
const steps = (status: string) => [
  { label: 'Pagamento aprovado', done: status === 'Pago' || status === 'Enviado' },
  { label: `Preparando a edição de ${publication.nextEdition.name}`, done: status === 'Enviado' },
  { label: status === 'Enviado' ? 'Revista enviada' : `Chega na sua casa em ${publication.nextEdition.when}`, done: status === 'Enviado' },
];

function OrderCard({ o }: { o: Order }) {
  const id = o.plano.toLowerCase();
  const cancelled = o.status === 'Cancelado';
  const waiting = o.status === 'Aguardando pagamento';
  return (
    <article className="ac-card">
      <div className="ac-plan">
        <img src={`/assets/plans/${['mensal', 'semestral', 'anual'].includes(id) ? id : 'mensal'}.webp`} alt="" />
        <div>
          <p className="ac-k">{cancelled ? 'Cancelada' : waiting ? 'Aguardando pagamento' : 'Ativa'}</p>
          <h2>Assinatura {o.plano}</h2>
          <p className="ac-muted">{editions(o.plano)} · {o.total}</p>
          <p className="ac-muted">Desde {since(o.created)}</p>
        </div>
      </div>
      {!cancelled && !waiting && (
        <ol className="ac-steps">
          {steps(o.status).map((s) => <li key={s.label} className={s.done ? 'is-done' : ''}><span>{s.done ? '✓' : ''}</span>{s.label}</li>)}
        </ol>
      )}
      {waiting && <p className="ac-note">Ainda não recebemos o pagamento deste pedido. Se você já pagou, ele atualiza sozinho em alguns minutos.</p>}
      {!cancelled && (
        <div className="ac-box">
          <p className="ac-k">O que vem na sua revista</p>
          <ul className="ac-tags">{['Conteúdos exclusivos', 'Jogos', 'Surpresa do mês', 'Adesivos', 'Marcador de página'].map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}
      <div className="ac-box">
        <p className="ac-k">Entrega</p>
        <p>{o.nome}<br />{o.endereco}<br />CEP {o.cep}</p>
        <a className="ac-link" href={`${WA}?text=${encodeURIComponent(`Oi! Quero mudar o endereço da minha assinatura (${o.email}).`)}`} target="_blank" rel="noopener">Mudar endereço pelo WhatsApp</a>
      </div>
      {o.plano === 'Mensal' && !cancelled && !waiting && <div className="ac-box ac-cancel"><CancelButton order={o.id} /></div>}
    </article>
  );
}

export default async function MinhaAssinatura({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const email = readToken((await cookies()).get(COOKIE)?.value);
  const orders = email ? await ordersByEmail(email).catch(() => []) : [];
  const shown = orders.filter((o) => o.status !== 'Aguardando pagamento' || !orders.some((p) => p.plano === o.plano && p.status !== 'Aguardando pagamento'));
  return (
    <>
      <SiteNav home={false} />
      <main className="ac-page">
        <p className="ac-k">Área da assinante</p>
        <h1 className="ac-h1">Minha assinatura</h1>
        {!email && <AccountLogin expired={q.expirou === '1'} />}
        {email && (
          <>
            <p className="ac-hello">Olá{orders[0]?.nome ? `, ${orders[0].nome.split(/\s+/)[0]}` : ''}! <span className="ac-muted">({email})</span></p>
            {shown.length ? shown.map((o) => <OrderCard key={o.id} o={o} />) : (
              <div className="ac-card"><p>Não encontramos assinaturas com este e-mail.</p><a className="ps-pay ac-btn" href="/assinatura#planos">Ver os planos</a></div>
            )}
            <div className="ac-help">
              <p>Dúvidas? Fale com a gente pelo <a href={WA} target="_blank" rel="noopener">WhatsApp</a> ou pelo e-mail <a href={`mailto:${publication.contact.email}`}>{publication.contact.email}</a>.</p>
              <form action="/api/conta/sair" method="post"><button type="submit" className="ac-link">Sair</button></form>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
