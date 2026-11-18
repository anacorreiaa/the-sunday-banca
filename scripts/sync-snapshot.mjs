// Refreshes data/archive-snapshot.json and data/popular-snapshot.json from Substack.
// Usage: npm run sync:archive
// Writes nothing unless the whole import succeeds.
import fs from 'node:fs';
import { fetchWholeArchive, fetchRankedIds } from '../lib/archive-core.mjs';
import publication from '../lib/publication.json' with { type: 'json' };

async function getJson(sort, { cursor, offset }) {
  const u = new URL('/api/v1/archive', publication.substackUrl);
  u.searchParams.set('sort', sort);
  if (cursor) u.searchParams.set('cursor', cursor);
  if (offset) u.searchParams.set('offset', String(offset));
  const res = await fetch(u, { headers: { accept: 'application/json', 'user-agent': 'the-sunday-banca-sync' }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${res.status} for ${u}`);
  await new Promise((r) => setTimeout(r, 400)); // be gentle
  return res.json();
}

const articles = await fetchWholeArchive((p) => getJson('new', p));
if (!articles.length) throw new Error('Archive came back empty; keeping the existing snapshot.');
const ids = await fetchRankedIds((p) => getJson('top', p));
const savedAt = new Date().toISOString();
fs.writeFileSync('data/archive-snapshot.json', JSON.stringify({ savedAt, source: 'substack-archive-api', articles }, null, 2) + '\n');
fs.writeFileSync('data/popular-snapshot.json', JSON.stringify({ savedAt, source: 'substack-archive-api sort=top', ids }, null, 2) + '\n');
console.log(`Saved ${articles.length} articles and a ranking of ${ids.length}.`);
