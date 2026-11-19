// Turns the photos in /mural into the mural (board) photos on the site.
// Photos are placed by file name order: 01-…, 02-…, up to the number of spots on the board.
// Any jpg, png, webp or heic works; they are resized here so big phone photos stay light.
import { readdir, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const src = path.join(root, 'mural');
const out = path.join(root, 'public', 'assets', 'mural');
const list = path.join(root, 'lib', 'mural.json');

const files = (await readdir(src).catch(() => []))
  .filter((f) => /\.(jpe?g|png|webp|heic|heif|avif)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, 'pt', { numeric: true }));

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const names = [];
for (const [i, f] of files.entries()) {
  const name = `${String(i + 1).padStart(2, '0')}.webp`;
  try {
    await sharp(path.join(src, f)).rotate().resize({ width: 800, height: 1000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(out, name));
    names.push(`assets/mural/${name}`);
  } catch (err) {
    console.warn(`[mural] skipped ${f}: ${err.message}`);
  }
}
await writeFile(list, JSON.stringify(names, null, 1) + '\n');
console.log(`[mural] ${names.length} photos`);
