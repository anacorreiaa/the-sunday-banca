import type { Metadata } from 'next';
import publication from '@/lib/publication.json';
import photoIds from '@/data/photos.json';
import excerpts from '@/data/excerpts.json';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import NewsletterList from '@/components/NewsletterList';
import { loadArchive } from '@/lib/substack';
import { cleanSubtitle, editionMeta } from '@/lib/editions';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Newsletter de domingo',
  description: 'Todas as edições da newsletter The Sunday Magazine, da mais nova à primeira. Receba grátis todo domingo no seu e-mail.',
  alternates: { canonical: '/newsletter' },
};

export default async function Newsletter() {
  const { articles } = await loadArchive();
  const photos = new Set<string>(photoIds);
  const posts = [...articles]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((a) => {
      const meta = editionMeta(a, photos, excerpts as Record<string, string[]>);
      return { id: a.postId, title: a.title, subtitle: cleanSubtitle(a.subtitle) || a.subtitle || '', url: a.url, photo: meta.photo, date: meta.dateShort, series: meta.series, tags: a.tags };
    });
  return (
    <>
      <SiteNav home={false} current="news" />
      <main className="news-main">
        <NewsletterList posts={posts} subscribeUrl={publication.subscribeUrl} labels={publication.tagLabels as Record<string, string>} />
      </main>
      <SiteFooter />
    </>
  );
}
