import publication from '@/lib/publication.json';
import photoIds from '@/data/photos.json';
import excerpts from '@/data/excerpts.json';
import Hero from '@/components/Hero';
import SiteNav from '@/components/SiteNav';
import CupDive from '@/components/CupDive';
import Room from '@/components/Room';
import FlipMagazine from '@/components/FlipMagazine';
import Newsstand from '@/components/Newsstand';
import SuggestionBoard from '@/components/SuggestionBoard';
import { EditionsProvider } from '@/components/Editions';
import { loadArchive } from '@/lib/substack';
import { editionMeta } from '@/lib/editions';
import { isConfigured } from '@/lib/recommend';

export const revalidate = 3600;

export default async function Home() {
  const { articles, popularIds } = await loadArchive();
  const photos = new Set<string>(photoIds);
  const editions = articles.map((article) => ({ article, meta: editionMeta(article, photos, excerpts as Record<string, string[]>) }));
  const formEnabled = !process.env.PREVIEW_EXPORT && isConfigured();

  return (
    <EditionsProvider editions={editions} tagLabels={publication.tagLabels}>
      <a className="skip" href="#edicoes">Pular para as edições</a>
      <SiteNav />
      <main>
        <Hero />
        <CupDive />
        {editions.length > 0 && <Room />}
        {editions.length > 0 && <FlipMagazine />}

        <SuggestionBoard copy={publication.suggestions} enabled={formEnabled} variant={(process.env.BOARD_VARIANT as 'a' | 'b' | 'c') || 'c'} />

        {editions.length > 0 ? (
          <Newsstand popularIds={popularIds} locale={publication.locale} />
        ) : (
          <p className="empty">Não conseguimos carregar as edições agora. Elas continuam todas no <a href={publication.substackUrl}>Substack</a>.</p>
        )}
      </main>
      <footer className="footer">
        <span>{publication.tagline}</span>
        <a href={publication.substackUrl}>thesundaymagazine.substack.com</a>
      </footer>
    </EditionsProvider>
  );
}
