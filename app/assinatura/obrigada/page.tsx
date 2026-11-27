import type { Metadata } from 'next';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import publication from '@/lib/publication.json';
import { newsHref } from '@/lib/links';

export const metadata: Metadata = { title: 'Obrigada!', robots: { index: false, follow: false } };

export default async function Obrigada({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const test = q.teste === '1';
  return (
    <>
      <SiteNav home={false} />
      <main className="tx-page">
        <div className="tx-photo" aria-hidden="true">
          <picture>
            <source media="(max-width: 760px)" srcSet="/assets/topo-natal-m.webp" />
            <img src="/assets/topo-natal.webp" alt="" />
          </picture>
        </div>
        <div className="tx-card">
          {test && <p className="ps-mp-badge">Teste · nada foi cobrado</p>}
          <p className="tx-k">Pedido confirmado ✓</p>
          <h1>Que alegria ter você na nossa mesa!</h1>
          <p className="tx-sub">A edição de <b>{publication.nextEdition.month}</b> chega na sua casa em breve. Enviamos os detalhes para o seu e-mail.</p>
          {(q.plano || q.total) && (
            <dl className="tx-lines">
              {q.plano && <div><dt>Plano</dt><dd>{q.plano}</dd></div>}
              {q.total && <div><dt>Total</dt><dd><b>{q.total}</b></dd></div>}
            </dl>
          )}
          <a className="tx-b1" href="/">Voltar para a The Sunday</a>
          <a className="tx-b2" href={newsHref}>Ler a newsletter</a>
          <p className="tx-foot">Para acompanhar a entrega e ver a sua assinatura, toque no ícone de perfil <span aria-hidden="true">👤</span> lá em cima e entre na <a href="/minha-assinatura">área da assinante</a>.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
