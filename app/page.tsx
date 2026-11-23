import type { Metadata } from 'next';
import publication from '@/lib/publication.json';
import photoIds from '@/data/photos.json';
import excerpts from '@/data/excerpts.json';
import StoreHero from '@/components/StoreHero';
import PlanCards from '@/components/PlanCards';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import CupDive from '@/components/CupDive';
import FlipMagazine from '@/components/FlipMagazine';
import SuggestionBoard from '@/components/SuggestionBoard';
import { EditionsProvider } from '@/components/Editions';
import { loadArchive } from '@/lib/substack';
import { editionMeta } from '@/lib/editions';
import { isConfigured } from '@/lib/recommend';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export const revalidate = 3600;

export default async function Home() {
  const { articles } = await loadArchive();
  const photos = new Set<string>(photoIds);
  const editions = articles.map((article) => ({ article, meta: editionMeta(article, photos, excerpts as Record<string, string[]>) }));
  const formEnabled = !process.env.PREVIEW_EXPORT && isConfigured();

  return (
    <EditionsProvider editions={editions} tagLabels={publication.tagLabels}>
      <a className="skip" href="#quem-somos">Pular para a revista</a>
      <SiteNav />
      <main>
        <StoreHero />
        <PlanCards />
        <CupDive />
        <div className="gingham-zone">
          {editions.length > 0 && <FlipMagazine />}
          <SuggestionBoard copy={publication.suggestions} enabled={formEnabled} variant={(process.env.BOARD_VARIANT as 'a' | 'b' | 'c') || 'c'} />
        </div>

        {/* The Sunday Talks (components/Room.tsx) comes back when the podcast launches. */}
      </main>
      <SiteFooter />
    </EditionsProvider>
  );
}
