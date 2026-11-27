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
const monthName = (iso: string) => (iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('pt-BR', { month: 'long', timeZone: 'UTC' }) : '');
const steps = (o: Order) => {
  const ed = o.ultima && o.ultima >= (o.recebeAte || '') ? o.ultima : o.recebeAte && o.recebeAte < new Date().toISOString().slice(0, 10) ? o.recebeAte : (o.primeira > new Date().toISOString().slice(0, 10) ? o.primeira : new Date().toISOString().slice(0, 7) + '-01');
  const sent = !!o.ultima && o.ultima.slice(0, 7) >= ed.slice(0, 7);
  return [
    { label: 'Pagamento aprovado', done: true },
    { label: `Preparando a edição de ${monthName(ed)}`, done: sent },
    { label: sent ? `Edição de ${monthName(ed)} enviada` : 'Chega na sua casa em breve', done: sent },
  ];
};

function OrderCard({ o }: { o: Order }) {
  const id = o.plano.toLowerCase();
  const cancelled = o.status === 'Cancelada';
  const stillGets = cancelled && o.recebeAte && o.recebeAte.slice(0, 7) >= new Date().toISOString().slice(0, 7);
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
      {(!cancelled || stillGets) && !waiting && (
        <ol className="ac-steps">
          {steps(o).map((s) => <li key={s.label} className={s.done ? 'is-done' : ''}><span>{s.done ? '✓' : ''}</span>{s.label}</li>)}
        </ol>
      )}
      {stillGets && <p className="ac-note">Você cancelou, mas ainda recebe a edição de {monthName(o.recebeAte)}, que já está paga.</p>}
      {waiting && <p className="ac-note">Ainda não recebemos o pagamento deste pedido. Se você já pagou, ele atualiza sozinho em alguns minutos.</p>}
      {!cancelled && (
        <div className="ac-box">
          <p className="ac-k">O que vem na sua revista</p>
          <ul className="ac-list">{['Conteúdos exclusivos', 'Jogos', 'A surpresa do mês', 'Sticker pack', 'Marcador de página'].map((t) => <li key={t}>{t}</li>)}</ul>
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
