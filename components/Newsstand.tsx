'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Article, CoverVariant } from '@/lib/types';
import { assignCovers, balanceRows, capacityFor } from '@/lib/magazines.mjs';
import { orderByPopularity } from '@/lib/archive-core.mjs';

type Props = {
  articles: Article[];
  popularIds: string[];
  covers: Record<string, CoverVariant[]>;
  tagLabels: Record<string, string>;
  locale: string;
};

type Sort = 'new' | 'popular';
const ALL = '__all__';
const GAP = 18; // px between magazines
const SIDE_PAD = 34; // px inside the shelf on each side
const AVG_WEIGHT = 140;
// Inline so the relative path resolves against the page (works on the site and in static previews).
const WOOD = { backgroundImage: 'url(assets/worn-wood.webp)', backgroundRepeat: 'repeat-x' } as const;

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function Newsstand({ articles, popularIds, covers, tagLabels, locale }: Props) {
  const [filter, setFilter] = useState<string>(ALL);
  const [sort, setSort] = useState<Sort>('new');
  const [rackWidth, setRackWidth] = useState<number | null>(null);
  const [open, setOpen] = useState<null | { index: number }>(null);
  const rackRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const label = useCallback((t: string) => tagLabels[t.toLowerCase()] ?? t, [tagLabels]);

  // Filters come from real, visible tags. "Geral" only appears if some post has no tags.
  const filters = useMemo(() => {
    const counts = new Map<string, number>();
    let untagged = 0;
    for (const a of articles) {
      if (!a.tags.length) untagged++;
      for (const t of a.tags) counts.set(t, (counts.get(t) || 0) + 1);
    }
    const list = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale)).map(([tag, count]) => ({ tag, count }));
    if (untagged) list.push({ tag: '__general__', count: untagged });
    return list;
  }, [articles, locale]);

  const visible = useMemo(() => {
    const ordered = sort === 'popular' ? orderByPopularity(articles, popularIds) : [...articles].sort((a, b) => b.date.localeCompare(a.date));
    if (filter === ALL) return ordered;
    if (filter === '__general__') return ordered.filter((a) => !a.tags.length);
    return ordered.filter((a) => a.tags.includes(filter));
  }, [articles, popularIds, sort, filter]);

  const { items } = useMemo(() => assignCovers(visible, covers), [visible, covers]);

  useIsoLayoutEffect(() => {
    const el = rackRef.current;
    if (!el) return;
    const measure = () => setRackWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const width = rackWidth ?? 1100;
  const capacity = capacityFor(width);
  const rowSizes = balanceRows(items.length, capacity);
  const inner = width - SIDE_PAD * 2;
  // One shared unit so a half-empty shelf keeps the same magazine size as a full one.
  const unit = (inner - GAP * (capacity - 1)) / (capacity * AVG_WEIGHT);

  const rows: (typeof items)[] = [];
  let k = 0;
  for (const n of rowSizes) {
    rows.push(items.slice(k, k + n));
    k += n;
  }

  const fmtDate = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }),
    [locale],
  );

  const openAt = (index: number, btn: HTMLButtonElement) => {
    openerRef.current = btn;
    setOpen({ index });
  };

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
  }, [open]);

  const close = () => {
    dialogRef.current?.close();
  };
  const onDialogClose = () => {
    setOpen(null);
    openerRef.current?.focus();
  };

  const current = open ? items[open.index] : null;
  const filterName = (tag: string) => (tag === '__general__' ? 'Geral' : label(tag));

  return (
    <section className="archive" aria-labelledby="archive-heading">
      <h2 id="archive-heading" className="sr-only">Edições</h2>
      <div className="controls">
        <div className="filters" role="group" aria-label="Filtrar por tema">
          <button type="button" className="chip" aria-pressed={filter === ALL} onClick={() => setFilter(ALL)}>
            Todas <span className="count">{articles.length}</span>
          </button>
          {filters.map((f) => (
            <button key={f.tag} type="button" className="chip" aria-pressed={filter === f.tag} onClick={() => setFilter(f.tag)}>
              {filterName(f.tag)} <span className="count">{f.count}</span>
            </button>
          ))}
        </div>
        <label className="sort">
          <span className="sort-label">Ordenar</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="new">Mais recentes</option>
            <option value="popular">Mais populares</option>
          </select>
        </label>
      </div>

      <p className="sr-only" aria-live="polite">
        {visible.length} {visible.length === 1 ? 'edição' : 'edições'}
      </p>

      <div
        className={`rack${rackWidth == null ? ' rack--measuring' : ''}`}
        ref={rackRef}
      >
        {items.length === 0 && <p className="empty">Nenhuma edição por aqui ainda.</p>}
        {rows.map((row, r) => {
          const total = row.reduce((s, it) => s + it.weight * unit, 0) + GAP * (row.length - 1);
          const fit = Math.min(1, inner / total);
          return (
            <div className="shelf-row" key={r} style={{ ['--wood-x' as string]: `${(r * 37) % 100}%` }}>
              <ul className="shelf-items" style={{ gap: GAP * fit }}>
                {row.map((it) => {
                  const idx = items.indexOf(it);
                  const w = it.weight * unit * fit;
                  const v = it.cover;
                  const h = v ? (w * v.height) / v.width : w * 1.25;
                  return (
                    <li
                      key={it.article.postId}
                      className="mag"
                      style={{
                        width: w,
                        height: h,
                        ['--lean' as string]: `${it.lean.toFixed(2)}deg`,
                        ['--thick' as string]: `${it.thickness.toFixed(1)}px`,
                      }}
                    >
                      <button
                        type="button"
                        className="mag-hit"
                        onClick={(e) => openAt(idx, e.currentTarget)}
                        aria-haspopup="dialog"
                        aria-label={`${it.article.title}, ${fmtDate.format(new Date(it.article.date))}`}
                      >
                        <span className="mag-body">
                          <span className="mag-pages" aria-hidden="true" />
                          {v ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="mag-cover" src={v.src} alt="" width={v.width} height={v.height} loading={r < 2 ? 'eager' : 'lazy'} decoding="async" />
                          ) : (
                            <span className="mag-cover mag-cover--fallback">{it.article.title}</span>
                          )}
                          <span className="mag-crease" aria-hidden="true" />
                          <span className="mag-sheen" aria-hidden="true" />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="shelf" aria-hidden="true">
                <span className="shelf-rail" style={WOOD} />
                <span className="shelf-board" style={WOOD} />
                <span className="shelf-lip" style={WOOD} />
                <span className="shelf-side shelf-side--l" style={WOOD} />
                <span className="shelf-side shelf-side--r" style={WOOD} />
              </div>
            </div>
          );
        })}
      </div>

      <dialog ref={dialogRef} className="preview" aria-labelledby="preview-title" onClose={onDialogClose} onClick={(e) => e.target === e.currentTarget && close()}>
        {current && (
          <div className="preview-inner">
            <div className="preview-cover">
              {current.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={current.cover.src} alt={`Capa de “${current.article.title}”`} width={current.cover.width} height={current.cover.height} />
              ) : (
                <div className="mag-cover--fallback">{current.article.title}</div>
              )}
            </div>
            <div className="preview-text">
              <p className="preview-meta">
                {current.article.tags.length ? current.article.tags.map(label).join(' · ') : 'Geral'}
                {current.article.isPaid && <span className="paid"> · Para assinantes pagos</span>}
              </p>
              <h3 id="preview-title">{current.article.title}</h3>
              <p className="preview-date">
                <time dateTime={current.article.date}>{fmtDate.format(new Date(current.article.date))}</time>
              </p>
              {current.article.subtitle && <p className="preview-sub">{current.article.subtitle}</p>}
              <a className="read" href={current.article.url} target="_blank" rel="noopener">
                Ler no Substack <span aria-hidden="true">↗</span>
              </a>
            </div>
            <button type="button" className="preview-close" onClick={close} aria-label="Fechar">
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}
      </dialog>
    </section>
  );
}
