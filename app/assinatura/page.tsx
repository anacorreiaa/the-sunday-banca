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
  description: 'A The Sunday impressa, todo mês na sua casa. Escolha o plano mensal, semestral ou anual.',
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
      <SiteNav home={false} current="print" />
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

        <PrintSubscribe plans={publication.printPlans} fixedFrete={publication.shipping.fixed}>
        {/* What comes in the box */}
        <section className="ps-kit" aria-labelledby="kit">
          <p className="ps-eyebrow">Na edição de Natal</p>
          <h2 id="kit" className="ps-h2">O que chega na sua casa</h2>
          <ul className="ps-kit-list ps-kit-list--4">
            <li>
              <div className="ps-kit-art ps-kit-art--mag" aria-hidden="true"><img src="/assets/edicao-00-capa.webp" alt="" /></div>
              <h3>A revista</h3>
            </li>
            <li>
              <div className="ps-kit-art" aria-hidden="true">
                <span className="ps-kit-page ps-kit-page--sudoku">
                  {[0, 1, 2, 3].map((g) => (
                    <span key={g} className="ps-kit-grid">{Array.from({ length: 16 }, (_, i) => <i key={i}>{(i * 7 + g * 3) % 5 === 0 ? ((i + g) % 9) + 1 : ''}</i>)}</span>
                  ))}
                </span>
              </div>
              <h3>Jogos inclusos</h3>
              <p>Sudoku, caça-palavras e outros passatempos.</p>
            </li>
            <li>
              <div className="ps-kit-art" aria-hidden="true">
                <span className="ps-kit-recipe">
                  <span className="ps-kit-recipe-t">Receita de Natal</span>
                  <span className="ps-kit-lines" />
                </span>
                <img className="ps-kit-recipe-d" src={`${D}berries.webp`} alt="" />
              </div>
              <h3>Receita de Natal</h3>
              <p>Um cartão com uma receita para a sua mesa.</p>
            </li>
            <li>
              <div className="ps-kit-art" aria-hidden="true">
                <img className="ps-teabag-img" src="/assets/drawn/tea-bag.svg" alt="" />
                <img className="ps-kit-tea-cup" src={`${D}cup-tea.webp`} alt="" />
              </div>
              <h3>Saquinho de chá</h3>
              <p>Para acompanhar a leitura, com calma.</p>
            </li>
          </ul>
        </section>
        </PrintSubscribe>
      </main>
      <SiteFooter />
    </>
  );
}
