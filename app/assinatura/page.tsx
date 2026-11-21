import type { Metadata } from 'next';
import publication from '@/lib/publication.json';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import PrintSubscribe from '@/components/PrintSubscribe';
import Cover from '@/components/Cover';
import photoIds from '@/data/photos.json';
import excerpts from '@/data/excerpts.json';
import { loadArchive } from '@/lib/substack';
import { editionMeta } from '@/lib/editions';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Assine a revista impressa · The Sunday Magazine',
  description: 'A The Sunday impressa, todo mês na sua casa. Escolha o plano mensal, semestral ou uma edição avulsa.',
  // Hidden while it is being tested.
  robots: { index: false, follow: false },
};

const D = '/assets/drawn/';

export default async function Assinatura() {
  const { articles } = await loadArchive();
  const photos = new Set<string>(photoIds);
  // The newest newsletter editions that have a photo, fanned out behind the printed Nº 0.
  const fan = [...articles]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((article) => ({ article, meta: editionMeta(article, photos, excerpts as Record<string, string[]>) }))
    .filter((e) => e.meta.photo)
    .slice(0, 6);
  return (
    <>
      <SiteNav home={false} />
      <main className="ps">
        {/* Hero: like the home page, gouache drawings around the words, and the magazine on the table */}
        <section className="ps-hero">
          <img className="ps-d ps-d--vase" src={`${D}vase.webp`} alt="" />
          <img className="ps-d ps-d--berries" src={`${D}berries.webp`} alt="" />
          <img className="ps-d ps-d--boat" src={`${D}boat.webp`} alt="" />
          <div className="ps-hero-text">
            <p className="ps-eyebrow">A revista impressa</p>
            <h1><span className="ps-script">The Sunday</span><span className="ps-h1-sub">na sua casa, todo mês</span></h1>
            <p className="ps-lead">A newsletter chega todo domingo no seu e-mail. A revista chega impressa na sua casa, para ler sem tela, com café e sem pressa.</p>
            <a className="ps-cta" href="#planos">Quero a minha <span aria-hidden="true">↓</span></a>
          </div>
          <div className="ps-fan" aria-hidden="true">
            {fan.map((e, i) => (
              <div key={e.article.postId} className="ps-fan-mag" style={{ ['--i' as string]: i - (fan.length - 1) / 2 }}>
                <Cover article={e.article} meta={e.meta} />
              </div>
            ))}
            <img className="ps-fan-print" src="/assets/edicao-00-capa.webp" alt="" />
            <img className="ps-still-cup" src={`${D}cup-blue.webp`} alt="" />
          </div>
        </section>

        <PrintSubscribe plans={publication.printPlans} />
      </main>
      <SiteFooter />
    </>
  );
}
