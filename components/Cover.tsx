// A The Sunday magazine cover: the edition's painted photo full-bleed, masthead and cover line printed over it.
// Every edition, old or new, gets the same layout; the series shows in a small coloured flag, not a solid block.
import type { Article } from '@/lib/types';
import type { EditionMeta } from '@/lib/editions';

function seriesFlag(meta: EditionMeta) {
  if (/tips/i.test(meta.series)) return 'Tips';
  if (/curios/i.test(meta.series)) return 'Curiosities';
  if (meta.series === 'Edição') return 'Edição';
  return meta.series.replace(/^The Sunday\s+/i, '');
}

export default function Cover({ article, meta }: { article: Article; meta: EditionMeta; eager?: boolean }) {
  // The painted version sits on top; if an edition has no painted photo yet, the plain photo underneath shows.
  const paint = meta.photo && /^assets\/photos\/\d+\.webp$/.test(meta.photo) ? meta.photo.replace('.webp', '-paint.webp') : null;
  const layers = [paint, meta.photo].filter(Boolean).map((u) => `url("${u}")`).join(', ');
  return (
    <span className="cover-wrap">
      <span className="cover" style={{ ['--accent' as string]: meta.color }}>
        <span className="cover-img" style={layers ? { backgroundImage: layers } : undefined} />
        <span className="cover-shade" />
        <span className="cover-top">
          <span className="cover-mast">The Sunday</span>
          <span className="cover-line">
            <span>{/^Nº/.test(meta.label) ? meta.label : 'Domingo'}</span>
            <span>{meta.dateShort}</span>
          </span>
        </span>
        <span className="cover-flag">{seriesFlag(meta)}</span>
        <span className="cover-bottom">
          <span className="cover-title">{article.title}</span>
          <span className="cover-barcode" />
        </span>
        <span className="cover-gloss" />
      </span>
    </span>
  );
}
