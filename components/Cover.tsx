// A standardized The Sunday magazine cover, drawn in HTML so every edition, old or new, matches.
import type { Article } from '@/lib/types';
import type { EditionMeta } from '@/lib/editions';

export default function Cover({ article, meta, eager = false }: { article: Article; meta: EditionMeta; eager?: boolean }) {
  return (
    <span className="cover-wrap">
    <span className="cover" style={{ ['--cover-bg' as string]: meta.color, ['--cover-ink' as string]: meta.ink }}>
      <span className="cover-mast">The Sunday</span>
      <span className="cover-line">
        <span>{meta.label}</span>
        <span>{meta.dateShort}</span>
      </span>
      <span className="cover-photo">
        {meta.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meta.photo} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" />
        ) : (
          <span className="cover-photo-empty" />
        )}
      </span>
      <span className="cover-title">{article.title}</span>
    </span>
    </span>
  );
}
