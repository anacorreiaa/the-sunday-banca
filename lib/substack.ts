// Live archive fetch with request-triggered hourly revalidation and saved-snapshot fallbacks.
import 'server-only';
import publication from './publication.json';
import archiveSnapshot from '../data/archive-snapshot.json';
import popularSnapshot from '../data/popular-snapshot.json';
import { fetchWholeArchive, fetchRankedIds, mergeArticles } from './archive-core.mjs';
import type { Article } from './types';

const REVALIDATE_SECONDS = 3600;
const TIMEOUT_MS = 8000;

async function getJson(url: string) {
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Substack ${res.status} for ${url}`);
  return res.json();
}

function archiveUrl(sort: 'new' | 'top', page: { cursor?: string | null; offset?: number }) {
  const u = new URL('/api/v1/archive', publication.substackUrl);
  u.searchParams.set('sort', sort);
  if (page.cursor) u.searchParams.set('cursor', page.cursor);
  if (page.offset) u.searchParams.set('offset', String(page.offset));
  return u.toString();
}

export type ArchiveResult = {
  articles: Article[];
  popularIds: string[];
  source: 'live' | 'snapshot';
  popularSource: 'live' | 'snapshot';
  snapshotSavedAt: string;
};

export async function loadArchive(): Promise<ArchiveResult> {
  const snapshotArticles = archiveSnapshot.articles as Article[];
  let articles = snapshotArticles;
  let source: ArchiveResult['source'] = 'snapshot';
  try {
    const live = (await fetchWholeArchive((p: { cursor?: string | null; offset?: number }) =>
      getJson(archiveUrl('new', p)),
    )) as Article[];
    if (live.length > 0) {
      // Live wins; snapshot only fills gaps (e.g. a post temporarily missing from a page).
      articles = mergeArticles(live, snapshotArticles);
      source = 'live';
    }
  } catch (err) {
    console.warn('[archive] using saved snapshot:', (err as Error).message);
  }

  let popularIds: string[] = popularSnapshot.ids;
  let popularSource: ArchiveResult['popularSource'] = 'snapshot';
  try {
    const ranked = await fetchRankedIds((p: { cursor?: string | null; offset?: number }) => getJson(archiveUrl('top', p)));
    if (ranked.length) {
      popularIds = ranked;
      popularSource = 'live';
    }
  } catch (err) {
    console.warn('[archive] using saved popularity snapshot:', (err as Error).message);
  }

  return { articles, popularIds, source, popularSource, snapshotSavedAt: archiveSnapshot.savedAt };
}

