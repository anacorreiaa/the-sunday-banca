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
  title: 'Sobre nós · The Sunday Magazine',
  description: 'Para quem gosta de saber um pouco de tudo. Conheça a The Sunday e folheie a revista.',
};

export default async function Sobre() {
  const { articles } = await loadArchive();
  const photos = new Set<string>(photoIds);
  const editions = articles.map((article) => ({ article, meta: editionMeta(article, photos, excerpts as Record<string, string[]>) }));
  return (
    <EditionsProvider editions={editions} tagLabels={publication.tagLabels}>
      <SiteNav home={false} current="about" />
      <main className="ps about-page">
        <section className="ps-about" aria-labelledby="ps-about-h">
          <p className="ps-eyebrow">Um pouco sobre nós</p>
          <h1 id="ps-about-h" className="ps-h2">Para quem gosta de saber um pouco de tudo.</h1>
          <p>A história por trás de um costume. Uma descoberta científica que muda nossa maneira de pensar. Um lugar que merece ser conhecido. Uma pergunta que nunca tínhamos pensado em fazer.</p>
          <p>A The Sunday reúne histórias e ideias para mulheres que continuam curiosas sobre o mundo.</p>
          <p className="ps-about-tag">The things they never taught us.</p>
        </section>
        <div className="gingham-zone about-mag">
          {editions.length > 0 && <FlipMagazine />}
        </div>
      </main>
      <SiteFooter />
    </EditionsProvider>
  );
}
