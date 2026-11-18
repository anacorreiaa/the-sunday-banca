// Downloads Substack share-image variants for posts that are not cached yet, optimizes them to
// 720px WebP and records them in data/cover-manifest.json.
// Usage: npm run sync:covers          (fails loudly)
//        node scripts/sync-covers.mjs --soft   (used before builds: never breaks a deploy)
import fs from 'node:fs';
import sharp from 'sharp';
import publication from '../lib/publication.json' with { type: 'json' };

const soft = process.argv.includes('--soft');
const STYLES = ['overlay', 'split', 'title'];
const RATIOS = ['grid', 'stories'];

try {
  const { articles } = JSON.parse(fs.readFileSync('data/archive-snapshot.json', 'utf8'));
  // Include posts published since the snapshot, when Substack is reachable.
  let live = [];
  try {
    const res = await fetch(new URL('/api/v1/archive?sort=new', publication.substackUrl), { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const body = await res.json();
      live = (Array.isArray(body) ? body : body.posts || []).map((p) => ({ id: p.slug || String(p.id), postId: String(p.id) }));
    }
  } catch {}
  const manifest = JSON.parse(fs.readFileSync('data/cover-manifest.json', 'utf8'));
  const have = new Set(manifest.covers.map((c) => `${c.postId}-${c.style}-${c.ratio}`));
  const targets = new Map([...articles, ...live].map((a) => [a.postId, a]));
  let added = 0;
  for (const a of targets.values()) {
    for (const style of STYLES) {
      for (const ratio of RATIOS) {
        const key = `${a.postId}-${style}-${ratio}`;
        const out = `public/assets/covers/${key}.webp`;
        if (have.has(key) && fs.existsSync(out)) continue;
        const src = `${publication.substackUrl}/api/v1/press_kit/asset/${a.postId}/${style}/composed?aspectRatio=${ratio}`;
        const res = await fetch(src, { signal: AbortSignal.timeout(30000) });
        if (!res.ok || !(res.headers.get('content-type') || '').startsWith('image/')) {
          console.warn(`skip ${key}: ${res.status}`);
          continue;
        }
        const info = await sharp(Buffer.from(await res.arrayBuffer())).resize({ width: 720 }).webp({ quality: 80 }).toFile(out);
        manifest.covers = manifest.covers.filter((c) => !(c.postId === a.postId && c.style === style && c.ratio === ratio));
        manifest.covers.push({ articleId: a.id, postId: a.postId, style, ratio, width: info.width, height: info.height, path: `assets/covers/${key}.webp`, sourceUrl: src });
        added++;
        await new Promise((r) => setTimeout(r, 300)); // low concurrency, gentle on Substack
      }
    }
  }
  manifest.savedAt = new Date().toISOString();
  fs.writeFileSync('data/cover-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Covers: ${added} new, ${manifest.covers.length} total.`);
} catch (err) {
  if (!soft) throw err;
  console.warn('[sync-covers] skipped:', err.message);
}
