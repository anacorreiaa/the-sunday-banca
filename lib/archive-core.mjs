// Pure helpers shared by the site (lib/substack.ts) and the sync scripts.
// No network code here, so it can be tested in isolation.

import publication from './publication.json' with { type: 'json' };

const allowedHosts = new Set(publication.allowedHosts);

/** True when the URL is https and on one of the publication's verified domains. */
export function isAllowedArticleUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && allowedHosts.has(u.hostname);
  } catch {
    return false;
  }
}

/** Raw Substack post -> normalized Article, or null when it is not a usable public post. */
export function normalizePost(p) {
  if (!p || typeof p !== 'object') return null;
  if (p.id == null || typeof p.title !== 'string' || !p.title.trim()) return null;
  if (typeof p.canonical_url !== 'string' || !isAllowedArticleUrl(p.canonical_url)) return null;
  const date = new Date(p.post_date);
  if (Number.isNaN(date.getTime())) return null;
  const tags = Array.isArray(p.postTags)
    ? [...new Set(p.postTags.map((t) => (t && typeof t.name === 'string' ? t.name.trim() : '')).filter(Boolean))]
    : [];
  return {
    id: String(p.slug || p.id),
    postId: String(p.id),
    title: p.title.trim(),
    subtitle: typeof p.subtitle === 'string' && p.subtitle.trim() ? p.subtitle.trim() : null,
    date: date.toISOString(),
    url: p.canonical_url,
    isPaid: p.audience === 'only_paid' || p.audience === 'founding',
    tags,
    coverImage: typeof p.cover_image === 'string' ? p.cover_image : null,
    excerpt: typeof p.truncated_body_text === 'string' && p.truncated_body_text.trim() ? p.truncated_body_text.trim() : null,
  };
}

/** Dedupe by postId (later batches never overwrite earlier ones) and sort newest first. */
export function mergeArticles(existing, incoming) {
  const byId = new Map(existing.map((a) => [a.postId, a]));
  for (const a of incoming) if (a && !byId.has(a.postId)) byId.set(a.postId, a);
  return [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Walk the whole archive. `fetchPage(cursorOrOffset)` returns the parsed JSON of one page.
 * Substack currently answers `{ posts, nextCursor }`; older publications answered a bare
 * array paged by offset. Both are handled. We stop only on an empty page or a missing
 * cursor, never because a page was "short", and bail out if paging stops adding records.
 */
export async function fetchWholeArchive(fetchPage, { maxPages = 200 } = {}) {
  let all = [];
  let cursor = null;
  let offset = 0;
  let mode = null;
  for (let page = 0; page < maxPages; page++) {
    const body = await fetchPage(mode === 'offset' ? { offset } : { cursor });
    let posts;
    let next = null;
    if (Array.isArray(body)) {
      mode = 'offset';
      posts = body;
    } else if (body && Array.isArray(body.posts)) {
      mode = 'cursor';
      posts = body.posts;
      next = typeof body.nextCursor === 'string' && body.nextCursor ? body.nextCursor : null;
    } else {
      throw new Error('Unexpected archive response shape');
    }
    if (posts.length === 0) return all;
    const before = all.length;
    all = mergeArticles(all, posts.map(normalizePost).filter(Boolean));
    if (all.length === before) throw new Error('Archive pagination repeated without adding posts');
    if (mode === 'cursor') {
      if (!next || next === cursor) return all;
      cursor = next;
    } else {
      offset += posts.length;
    }
  }
  throw new Error('Archive pagination did not finish');
}

/** Post IDs in the exact order Substack returns them (used for `sort=top`), across all pages. */
export async function fetchRankedIds(fetchPage, { maxPages = 200 } = {}) {
  const ids = [];
  const seen = new Set();
  let cursor = null;
  let offset = 0;
  let mode = null;
  for (let page = 0; page < maxPages; page++) {
    const body = await fetchPage(mode === 'offset' ? { offset } : { cursor });
    const posts = Array.isArray(body) ? body : body && Array.isArray(body.posts) ? body.posts : null;
    if (!posts) throw new Error('Unexpected archive response shape');
    mode = Array.isArray(body) ? 'offset' : 'cursor';
    if (posts.length === 0) return ids;
    const before = ids.length;
    for (const p of posts) {
      const id = p && p.id != null ? String(p.id) : null;
      if (id && !seen.has(id)) { seen.add(id); ids.push(id); }
    }
    if (ids.length === before) throw new Error('Ranking pagination repeated without adding posts');
    if (mode === 'cursor') {
      const next = typeof body.nextCursor === 'string' && body.nextCursor ? body.nextCursor : null;
      if (!next || next === cursor) return ids;
      cursor = next;
    } else {
      offset += posts.length;
    }
  }
  throw new Error('Ranking pagination did not finish');
}

/** Ranked order from Substack's own `sort=top` listing; unranked articles go after, newest first. */
export function orderByPopularity(articles, rankedIds) {
  const rank = new Map(rankedIds.map((id, i) => [String(id), i]));
  const ranked = articles.filter((a) => rank.has(a.postId)).sort((a, b) => rank.get(a.postId) - rank.get(b.postId));
  const rest = articles.filter((a) => !rank.has(a.postId)).sort((a, b) => b.date.localeCompare(a.date));
  return [...ranked, ...rest];
}
