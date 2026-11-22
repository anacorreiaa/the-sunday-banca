import type { Metadata } from 'next';
import publication from '@/lib/publication.json';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import PrintSubscribe from '@/components/PrintSubscribe';
import Newsstand from '@/components/Newsstand';
import { EditionsProvider } from '@/components/Editions';
import photoIds from '@/data/photos.json';
import excerpts from '@/data/excerpts.json';
import { loadArchive } from '@/lib/substack';
import { editionMeta } from '@/lib/editions';

const D = '/assets/drawn/';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Assine a revista impressa · The Sunday Magazine',
  description: 'A The Sunday impressa, todo mês na sua casa. Escolha o plano mensal, semestral ou anual.',
};

export default async function Assinatura() {
  const { articles, popularIds } = await loadArchive();
  const photos = new Set<string>(photoIds);
  const editions = articles.map((article) => ({ article, meta: editionMeta(article, photos, excerpts as Record<string, string[]>) }));
  return (
    <EditionsProvider editions={editions} tagLabels={publication.tagLabels}>
      <SiteNav home={false} current="print" />
      <main className="ps">
        {/* The page opens on the coffee table with every edition on it; the same floor runs on under the plans. */}
        <div className="ps-cover">
          <Newsstand popularIds={popularIds} locale={publication.locale} />
        </div>

        <PrintSubscribe plans={publication.printPlans} fixedFrete={publication.shipping.fixed}>
        {/* What comes in the box */}
        <section className="ps-kit" aria-labelledby="kit">
          <p className="ps-eyebrow">Na edição de Natal</p>
          <h2 id="kit" className="ps-h2">O que chega na sua casa</h2>
          <ul className="ps-kit-list">
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
          </ul>
        </section>
        </PrintSubscribe>
      </main>
      <SiteFooter />
    </EditionsProvider>
  );
}
