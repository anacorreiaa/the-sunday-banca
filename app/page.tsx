import publication from '@/lib/publication.json';
import photoIds from '@/data/photos.json';
import excerpts from '@/data/excerpts.json';
import PrintHero from '@/components/PrintHero';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import CupDive from '@/components/CupDive';
import FlipMagazine from '@/components/FlipMagazine';
import Newsstand from '@/components/Newsstand';
import SuggestionBoard from '@/components/SuggestionBoard';
import PlansPreview from '@/components/PlansPreview';
import { EditionsProvider } from '@/components/Editions';
import { loadArchive } from '@/lib/substack';
import { editionMeta } from '@/lib/editions';
import { isConfigured } from '@/lib/recommend';

export const revalidate = 3600;

export default async function Home() {
  const { articles, popularIds } = await loadArchive();
  const photos = new Set<string>(photoIds);
  const editions = articles.map((article) => ({ article, meta: editionMeta(article, photos, excerpts as Record<string, string[]>) }));
  const fan = [...editions]
    .sort((a, b) => b.article.date.localeCompare(a.article.date))
    .filter((e) => e.meta.photo)
    .slice(0, 6);
  const formEnabled = !process.env.PREVIEW_EXPORT && isConfigured();

  return (
    <EditionsProvider editions={editions} tagLabels={publication.tagLabels}>
      <a className="skip" href="#edicoes">Pular para as edições</a>
      <SiteNav />
      <main>
        <div className="ps home-hero"><PrintHero fan={fan} hint home /></div>
        <CupDive />
        <div className="gingham-zone">
          {editions.length > 0 && <FlipMagazine />}
          <PlansPreview />
        </div>

        <SuggestionBoard copy={publication.suggestions} enabled={formEnabled} variant={(process.env.BOARD_VARIANT as 'a' | 'b' | 'c') || 'c'} />

        {editions.length > 0 ? (
          <Newsstand popularIds={popularIds} locale={publication.locale} />
        ) : (
          <p className="empty">Não conseguimos carregar as edições agora. Elas continuam todas no <a href={publication.substackUrl}>Substack</a>.</p>
        )}
        {/* The Sunday Talks (components/Room.tsx) comes back when the podcast launches. */}
      </main>
      <SiteFooter />
    </EditionsProvider>
  );
}
