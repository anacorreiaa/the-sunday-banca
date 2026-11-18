// Builds app/opengraph-image.png (1200x630): wordmark over a row of real covers.
import sharp from 'sharp';
const W = 1200, H = 630;
const covers = ['223842948-overlay-stories', '223971609-title-grid', '223641678-split-stories', '224614198-overlay-grid', '224657178-title-stories'];
const h = 300;
const imgs = await Promise.all(covers.map(async (c) => {
  const buf = await sharp(`public/assets/covers/${c}.webp`).resize({ height: h }).png().toBuffer();
  const { width } = await sharp(buf).metadata();
  return { buf, width };
}));
const gap = 22, total = imgs.reduce((s, i) => s + i.width, 0) + gap * (imgs.length - 1);
let x = Math.round((W - total) / 2);
const top = H - h - 70;
const composites = [];
for (const i of imgs) { composites.push({ input: i.buf, left: x, top }); x += i.width + gap; }
const wm = await sharp('public/assets/wordmark.svg', { density: 110 }).resize({ width: 520 }).png().toBuffer();
const wmMeta = await sharp(wm).metadata();
composites.unshift({ input: wm, left: Math.round((W - wmMeta.width) / 2), top: 48 });
const shelf = await sharp('public/assets/worn-wood.webp').resize(W - 120, 22, { fit: 'cover' }).png().toBuffer();
composites.push({ input: shelf, left: 60, top: H - 70 });
await sharp({ create: { width: W, height: H, channels: 3, background: '#FAF8F3' } }).composite(composites).png({ compressionLevel: 9 }).toFile('app/opengraph-image.png');
console.log('ok');
