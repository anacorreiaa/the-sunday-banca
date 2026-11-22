'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Article } from '@/lib/types';
import { hash } from '@/lib/magazines.mjs';
import { orderByPopularity } from '@/lib/archive-core.mjs';
import Cover from './Cover';
import { useEditions } from './Editions';

type Props = { popularIds: string[]; locale: string; eyebrow?: string; title?: string; intro?: string; controls?: boolean };
type Sort = 'new' | 'popular';
const ALL = '__all__';

/** Where the newest editions lie on the table: only the free middle of the wood, clear of the flowers,
 *  books, berries, glasses and cup (left/top in % of the table picture, tilt in degrees). */
const ON_TABLE = [
  { x: 31, y: 31, r: -5 },
  { x: 44, y: 30, r: 3 },
  { x: 57, y: 31.5, r: -2.5 },
  { x: 36.5, y: 38, r: 4 },
  { x: 49.5, y: 37.5, r: -3 },
  { x: 60, y: 38.5, r: 6 },
];

/** Every edition lies on the table. The newest six take the spots above; older ones are piled
 *  underneath the same spots, a little shifted and turned, so new issues cover the old ones. */
function spot(i: number, id: string) {
  const base = ON_TABLE[i % ON_TABLE.length];
  const layer = Math.floor(i / ON_TABLE.length);
  if (!layer) return { ...base, z: 1000 - i };
  const h = hash(id);
  const dx = (((h % 200) / 100) - 1) * 2.2 * Math.min(layer, 3);
  const dy = ((((h >> 3) % 200) / 100) - 1) * 2.2 * Math.min(layer, 3);
  const dr = (((h >> 6) % 160) / 10) - 8;
  return { x: base.x + dx, y: base.y + dy, r: base.r + dr, z: 1000 - i };
}

export default function Newsstand({ popularIds, locale, eyebrow = 'A banca', title = 'Todas as edições', intro, controls = true }: Props) {
  const { editions, byId, open: openEdition, label } = useEditions();
  const articles = useMemo<Article[]>(() => editions.map((e) => e.article), [editions]);
  const [filter, setFilter] = useState<string>(ALL);
  const [sort, setSort] = useState<Sort>('new');

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

  // The top menu can ask for a filter ("Edições", "The Sunday Tips").
  useEffect(() => {
    const on = (e: Event) => {
      const want = String((e as CustomEvent).detail || '').toLowerCase();
      const hit = filters.find((f) => f.tag.toLowerCase() === want);
      setFilter(hit ? hit.tag : ALL);
    };
    window.addEventListener('sunday:filter', on);
    // Coming from another page with ?tema=… (e.g. the games room menu).
    const tema = new URLSearchParams(window.location.search).get('tema');
    if (tema) on(new CustomEvent('sunday:filter', { detail: tema }));
    return () => window.removeEventListener('sunday:filter', on);
  }, [filters]);

  const visible = useMemo(() => {
    const ordered = sort === 'popular' ? orderByPopularity(articles, popularIds) : [...articles].sort((a, b) => b.date.localeCompare(a.date));
    if (filter === ALL) return ordered;
    if (filter === '__general__') return ordered.filter((a) => !a.tags.length);
    return ordered.filter((a) => a.tags.includes(filter));
  }, [articles, popularIds, sort, filter]);

  const filterName = (tag: string) => (tag === '__general__' ? 'Geral' : label(tag));

  const tableRef = useRef<HTMLDivElement>(null);


  const mag = (a: Article, i: number, style: React.CSSProperties, cls = '') => {
    const ed = byId.get(a.postId)!;
    return (
      <li key={a.postId} className={`table-mag ${cls}`} style={style}>
        <button type="button" className="mag-hit" onClick={(e) => openEdition(a.postId, e.currentTarget)} aria-haspopup="dialog" aria-label={`${a.title}, ${ed.meta.dateLong}`}>
          <span className="table-mag-body">
            <Cover article={a} meta={ed.meta} eager={i < 5} />
          </span>
        </button>
      </li>
    );
  };

  return (
    <section className="archive archive--table" id="edicoes" aria-labelledby="archive-heading">
      <div className="table-head">
        <div className="table-card">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="archive-heading">{title}</h2>
          {intro && <p className="table-intro">{intro}</p>}
          {controls && <div className="controls">
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
          </div>}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{visible.length} {visible.length === 1 ? 'edição' : 'edições'}</p>

      <div className="table-scroll" ref={tableRef}>
      <ul className="table-stage" aria-label="Edições mais recentes">
        {visible.map((a, i) => {
          const p = spot(i, a.postId);
          return mag(a, i, { ['--sx' as string]: `${p.x}%`, ['--sy' as string]: `${p.y}%`, ['--rot' as string]: `${p.r}deg`, ['--sz' as string]: p.z });
        })}
      </ul>
      </div>

      {visible.length === 0 && <p className="empty">Nenhuma edição por aqui ainda.</p>}
    </section>
  );
}
