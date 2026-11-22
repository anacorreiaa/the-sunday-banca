import type { Metadata } from 'next';
import publication from '@/lib/publication.json';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import PrintSubscribe from '@/components/PrintSubscribe';
import Newsstand from '@/components/Newsstand';
import StickySubscribe from '@/components/StickySubscribe';
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
      <main className="ps ps-page">
        {/* Opening: what The Sunday is, then what arrives at home */}
        <section className="ps-intro" aria-labelledby="ps-intro-h">
          <p className="ps-eyebrow">The Sunday Magazine</p>
          <h1 id="ps-intro-h" className="ps-intro-h">Uma boa leitura também pode chegar pelo correio.</h1>
          <p className="ps-intro-lead">Uma revista mensal para mulheres curiosas. Histórias, descobertas e pequenas surpresas para levar a vida além da rotina.</p>
          <a className="ps-cta" href="#planos">Ver os planos <span aria-hidden="true">↓</span></a>
        </section>

        <section className="ps-kit ps-kit--lead" aria-labelledby="kit">
          <p className="ps-eyebrow">A experiência The Sunday</p>
          <h2 id="kit" className="ps-h2">O que chega na sua casa</h2>
          <div className="ps-kit-hero">
            <div className="ps-kit-main">
              <div className="ps-kit-art ps-kit-art--mag" aria-hidden="true"><img src="/assets/edicao-00-capa.webp" alt="" /></div>
              <h3>A revista</h3>
              <p>24 páginas impressas, todo mês, para ler sem tela e guardar na estante.</p>
            </div>
            <ul className="ps-kit-extras">
              <li>
                <div className="ps-kit-art ps-kit-art--small" aria-hidden="true">
                  <span className="ps-kit-page ps-kit-page--sudoku">
                    {[0, 1, 2, 3].map((g) => (
                      <span key={g} className="ps-kit-grid">{Array.from({ length: 16 }, (_, i) => <i key={i}>{(i * 7 + g * 3) % 5 === 0 ? ((i + g) % 9) + 1 : ''}</i>)}</span>
                    ))}
                  </span>
                </div>
                <h3>Jogos</h3>
                <p>Sudoku, caça-palavras e outros passatempos dentro da revista.</p>
              </li>
              <li>
                <div className="ps-kit-art ps-kit-art--small" aria-hidden="true">
                  <span className="ps-kit-recipe">
                    <span className="ps-kit-recipe-t">Surpresa do mês</span>
                    <span className="ps-kit-lines" />
                  </span>
                  <img className="ps-kit-recipe-d" src={`${D}berries.webp`} alt="" />
                </div>
                <h3>Surpresa do mês</h3>
                <p>Um mimo diferente a cada edição. Em dezembro, uma receita de Natal.</p>
              </li>
            </ul>
          </div>
        </section>

        {/* Why read it, before the prices */}
        <section className="ps-about" aria-labelledby="ps-about-h">
          <p className="ps-eyebrow">Um pouco sobre nós</p>
          <h2 id="ps-about-h" className="ps-h2">Para quem gosta de saber um pouco de tudo.</h2>
          <p>A história por trás de um costume. Uma descoberta científica que muda nossa maneira de pensar. Um lugar que merece ser conhecido. Uma pergunta que nunca tínhamos pensado em fazer.</p>
          <p>A The Sunday reúne histórias e ideias para mulheres que continuam curiosas sobre o mundo.</p>
          <p className="ps-about-tag">The things they never taught us.</p>
        </section>

        <PrintSubscribe plans={publication.printPlans} fixedFrete={publication.shipping.fixed} />

        {/* The collection on the coffee table, then one last invitation. */}
        <div className="ps-cover">
          <Newsstand popularIds={popularIds} locale={publication.locale} eyebrow="A coleção" title="Uma coleção para guardar" intro="Cada mês, uma nova edição. Histórias diferentes, capas para colecionar e assuntos que merecem voltar à conversa. Toque numa capa para ler." controls={false} />
        </div>
        <section className="ps-close">
          <p className="ps-close-h">Sente-se, a mesa está posta.</p>
          <a className="ps-cta" href="#planos">Quero a minha <span aria-hidden="true">↑</span></a>
        </section>
        <StickySubscribe />
      </main>
      <SiteFooter />
    </EditionsProvider>
  );
}
