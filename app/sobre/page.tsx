import type { Metadata } from 'next';
import publication from '@/lib/publication.json';
import photoIds from '@/data/photos.json';
import excerpts from '@/data/excerpts.json';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import FlipMagazine from '@/components/FlipMagazine';
import { EditionsProvider } from '@/components/Editions';
import { loadArchive } from '@/lib/substack';
import { editionMeta } from '@/lib/editions';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Sobre nós: o que a gente escreve',
  description: 'Conheça a The Sunday: histórias dos costumes, comportamento, ciência do dia a dia, arte e viagens, para mulheres curiosas. Folheie a revista.',
  alternates: { canonical: '/sobre' },
};

export default async function Sobre() {
  const { articles } = await loadArchive();
  const photos = new Set<string>(photoIds);
  const editions = articles.map((article) => ({ article, meta: editionMeta(article, photos, excerpts as Record<string, string[]>) }));
  return (
    <EditionsProvider editions={editions} tagLabels={publication.tagLabels}>
      <SiteNav home={false} current="about" />
      <main className="ps about-page">
        <section className="store-hero rv-hero ab-hero" aria-labelledby="ab-h">
          <picture>
            <source media="(max-width: 760px)" srcSet="/assets/revista-topo-m.webp" />
            <img src="/assets/revista-topo.webp" alt="Café da manhã na cama com chá e um livro aberto" fetchPriority="high" />
          </picture>
          <div className="store-hero-text">
            <p className="store-kick">Um pouco sobre nós</p>
            <h1 id="ab-h">Para quem gosta de saber um pouco de tudo.</h1>
            <p>Histórias e ideias para mulheres que continuam curiosas sobre o mundo.</p>
          </div>
        </section>

        <section className="ab-write" aria-labelledby="ab-w">
          <p className="ps-eyebrow">O que a gente escreve</p>
          <h2 id="ab-w" className="ab-h2">Uma pergunta boa por semana.</h2>
          <p className="ab-lead">Toda edição parte de uma curiosidade do dia a dia, daquelas que a gente nunca parou para pensar. A gente pesquisa a história, a ciência e o comportamento por trás dela e conta tudo de um jeito leve.</p>

          <div className="ab-formats">
            <article className="ab-format">
              <h3>As histórias de domingo</h3>
              <p>Textos que pegam um costume, um hábito ou uma situação comum e contam de onde aquilo veio e por que a gente age assim.</p>
              <ul className="ab-links">
                <li><a href="https://thesundaymagazine.substack.com/p/quando-comecamos-a-viajar-por-prazer" target="_blank" rel="noopener">Quando começamos a viajar por prazer? <span aria-hidden="true">→</span></a></li>
                <li><a href="https://thesundaymagazine.substack.com/p/a-desconhecida-a-mesa" target="_blank" rel="noopener">A desconhecida à mesa <span aria-hidden="true">→</span></a></li>
                <li><a href="https://thesundaymagazine.substack.com/p/quem-nos-ensinou-a-parar-de-perguntar" target="_blank" rel="noopener">Quem nos ensinou a parar de perguntar? <span aria-hidden="true">→</span></a></li>
              </ul>
            </article>
            <article className="ab-format">
              <h3>The Sunday Tips</h3>
              <p>Pequenos guias práticos, para usar na vida real: aquilo que todo mundo finge que sabe, explicado sem cerimônia.</p>
              <ul className="ab-links">
                <li><a href="https://thesundaymagazine.substack.com/p/um-guia-para-entender-os-talheres" target="_blank" rel="noopener">Um guia para entender os talheres à mesa <span aria-hidden="true">→</span></a></li>
                <li><a href="https://thesundaymagazine.substack.com/p/como-olhar-para-um-quadro-e-enxergar" target="_blank" rel="noopener">Como olhar para um quadro e enxergar mais do que uma pintura? <span aria-hidden="true">→</span></a></li>
              </ul>
            </article>
            <article className="ab-format">
              <h3>The Sunday Curiosities</h3>
              <p>O que a ciência e os números dizem sobre coisas que fazem parte da nossa rotina.</p>
              <ul className="ab-links">
                <li><a href="https://thesundaymagazine.substack.com/p/por-que-estamos-tao-obcecados-em" target="_blank" rel="noopener">Por que estamos tão obcecados em medir o próprio sono? <span aria-hidden="true">→</span></a></li>
              </ul>
            </article>
          </div>

          <h3 className="ab-th">Os temas que mais aparecem</h3>
          <ul className="ab-topics">
            {['História dos costumes', 'Comportamento e relações', 'Ciência do dia a dia', 'Arte e museus', 'Viagens', 'Mesa e etiqueta', 'Bem-estar', 'Cultura'].map((t) => <li key={t}>{t}</li>)}
          </ul>

          <div className="ab-two">
            <div>
              <h3>Como a gente escreve</h3>
              <p>Sem jargão e sem pressa. Textos curtos o bastante para caber num domingo e cuidadosos o bastante para você sair sabendo algo novo, e com vontade de contar para alguém.</p>
            </div>
            <div>
              <h3>Na newsletter e na revista</h3>
              <p>A newsletter chega todo domingo no seu e-mail. A revista impressa chega na sua casa com conteúdos exclusivos, jogos e uma surpresa por edição, para ler sem tela e colecionar.</p>
            </div>
          </div>

          <p className="ps-about-tag ab-tag">The things they never taught us.</p>
        </section>

        <div className="gingham-zone about-mag">
          {editions.length > 0 && <FlipMagazine />}
        </div>
      </main>
      <SiteFooter />
    </EditionsProvider>
  );
}
