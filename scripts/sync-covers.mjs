// Saves each post's own cover photo as a 1000px WebP in public/assets/photos and lists it in data/photos.json.
// The site draws every magazine cover in HTML around this photo, so all editions share one design.
// Usage: npm run sync:covers          (fails loudly)
//        node scripts/sync-covers.mjs --soft   (used before builds: never breaks a deploy)
import fs from 'node:fs';
import sharp from 'sharp';
import publication from '../lib/publication.json' with { type: 'json' };

const soft = process.argv.includes('--soft');
try {
  const res = await fetch(new URL('/api/v1/archive?sort=new', publication.substackUrl), { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`archive ${res.status}`);
  const body = await res.json();
  const posts = Array.isArray(body) ? body : body.posts || [];
  const have = new Set(JSON.parse(fs.readFileSync('data/photos.json', 'utf8')));
  let added = 0;
  for (const p of posts) {
    const id = String(p.id);
    if (have.has(id) || typeof p.cover_image !== 'string') continue;
    const img = await fetch(p.cover_image, { signal: AbortSignal.timeout(30000) });
    if (!img.ok || !(img.headers.get('content-type') || '').startsWith('image/')) continue;
    await sharp(Buffer.from(await img.arrayBuffer())).resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 80 }).toFile(`public/assets/photos/${id}.webp`);
    have.add(id);
    added++;
    await new Promise((r) => setTimeout(r, 300));
  }
  fs.writeFileSync('data/photos.json', JSON.stringify([...have].sort()) + '\n');
  console.log(`Photos: ${added} new, ${have.size} total.`);
} catch (err) {
  if (!soft) throw err;
  console.warn('[sync-covers] skipped:', err.message);
}
