// One-off: turn the browser-captured bundle (raw Substack archive + press-kit images) into
// the site's snapshots, optimized covers and manifest. Usage: node scripts/tools/import-bundle.mjs <bundle-dir>
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { normalizePost, mergeArticles } from '../../lib/archive-core.mjs';

const dir = process.argv[2];
const raw = JSON.parse(fs.readFileSync(path.join(dir, 'archive.json'), 'utf8'));
const articles = mergeArticles([], raw.newPosts.map(normalizePost).filter(Boolean));
fs.writeFileSync('data/archive-snapshot.json', JSON.stringify({ savedAt: raw.fetchedAt, source: 'substack-archive-api', articles }, null, 2));
fs.writeFileSync('data/popular-snapshot.json', JSON.stringify({ savedAt: raw.fetchedAt, source: 'substack-archive-api sort=top', ids: raw.topPosts.map((p) => String(p.id)) }, null, 2));

const manifest = [];
for (const a of articles) {
  for (const style of ['overlay', 'split', 'title']) {
    for (const ratio of ['grid', 'stories']) {
      const src = path.join(dir, 'img', `${a.postId}_${style}_${ratio}.jpg`);
      if (!fs.existsSync(src)) continue;
      const out = `public/assets/covers/${a.postId}-${style}-${ratio}.webp`;
      const info = await sharp(src).resize({ width: 720 }).webp({ quality: 80 }).toFile(out);
      manifest.push({ articleId: a.id, postId: a.postId, style, ratio, width: info.width, height: info.height,
        path: out.replace('public/', ''),
        sourceUrl: `https://thesundaymagazine.substack.com/api/v1/press_kit/asset/${a.postId}/${style}/composed?aspectRatio=${ratio}` });
    }
  }
}
fs.writeFileSync('data/cover-manifest.json', JSON.stringify({ savedAt: raw.fetchedAt, covers: manifest }, null, 2));
console.log(articles.length, 'articles,', manifest.length, 'covers');
