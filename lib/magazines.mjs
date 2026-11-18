// Stable physical variation per article, and cover-style assignment over the visible order.

/** FNV-1a 32-bit hash -> unsigned int. Stable across reloads and builds. */
export function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic number in [min, max] derived from the article id and a salt. */
function pick(id, salt, min, max) {
  return min + ((hash(`${id}:${salt}`) % 10001) / 10000) * (max - min);
}

const STYLES = ['overlay', 'split', 'title'];

/**
 * Physical traits for one article. `ratio` is chosen from the variants that actually exist,
 * so a wide image is never forced into a tall slot.
 */
export function physical(id, variants) {
  const ratios = [...new Set(variants.map((v) => v.ratio))];
  const ratio = ratios.length > 1 ? (hash(`${id}:ratio`) % 2 === 0 ? 'stories' : 'grid') : ratios[0] || 'grid';
  const weight = ratio === 'stories' ? pick(id, 'w', 108, 132) : pick(id, 'w', 138, 175);
  return {
    ratio,
    weight,
    lean: pick(id, 'lean', -1.5, 1.5),
    thickness: pick(id, 'thick', 2, 4),
    preferredStyle: STYLES[hash(`${id}:style`) % STYLES.length],
  };
}

/**
 * Walk the visible articles in order and choose each one's cover variant so that no three
 * consecutive covers share a layout style. Falls back to the preferred style (and reports it)
 * only when an article has no alternative variant.
 */
export function assignCovers(visible, variantsById) {
  const out = [];
  const violations = [];
  for (let i = 0; i < visible.length; i++) {
    const a = visible[i];
    const variants = variantsById[a.postId] || [];
    const phys = physical(a.id, variants);
    const sameRatio = variants.filter((v) => v.ratio === phys.ratio);
    const pool = sameRatio.length ? sameRatio : variants;
    const prev2 = out.length >= 2 && out[out.length - 1].style && out[out.length - 1].style === out[out.length - 2].style
      ? out[out.length - 1].style
      : null;
    const order = [phys.preferredStyle, ...STYLES.filter((s) => s !== phys.preferredStyle)];
    let chosen = null;
    for (const s of order) {
      if (s === prev2) continue;
      chosen = pool.find((v) => v.style === s);
      if (chosen) break;
    }
    if (!chosen) {
      chosen = pool.find((v) => v.style === phys.preferredStyle) || pool[0] || null;
      if (chosen && prev2 && chosen.style === prev2) violations.push(a.id);
    }
    out.push({ article: a, ...phys, cover: chosen, style: chosen ? chosen.style : null });
  }
  return { items: out, violations };
}

/** Magazines per full shelf for a measured rack width (starting points from the build guide). */
export function capacityFor(width) {
  if (width >= 950) return 8;
  if (width >= 650) return 7;
  if (width >= 460) return 4;
  if (width >= 360) return 3;
  return 2;
}

/** Split n items into balanced rows of at most `capacity`, e.g. 63 @ 8 -> 7×8 + 1×7. */
export function balanceRows(n, capacity) {
  if (n === 0) return [];
  const rows = Math.ceil(n / capacity);
  const base = Math.floor(n / rows);
  const extra = n % rows;
  return Array.from({ length: rows }, (_, i) => base + (i < extra ? 1 : 0));
}
