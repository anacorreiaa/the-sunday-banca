'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Article } from '@/lib/types';
import { hash } from '@/lib/magazines.mjs';
import { orderByPopularity } from '@/lib/archive-core.mjs';
import Cover from './Cover';
import { useEditions } from './Editions';

type Props = { popularIds: string[]; locale: string };
type Sort = 'new' | 'popular';
const ALL = '__all__';

/** Stable "dropped on the table" variation per edition. */
function scatter(id: string) {
  const h = hash(id);
  return { rot: ((h % 1300) / 100 - 6.5).toFixed(2), dy: ((h >> 8) % 26) - 13, dx: ((h >> 16) % 18) - 9 };
}

export default function Newsstand({ popularIds, locale }: Props) {
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
    return () => window.removeEventListener('sunday:filter', on);
  }, [filters]);

  const visible = useMemo(() => {
    const ordered = sort === 'popular' ? orderByPopularity(articles, popularIds) : [...articles].sort((a, b) => b.date.localeCompare(a.date));
    if (filter === ALL) return ordered;
    if (filter === '__general__') return ordered.filter((a) => !a.tags.length);
    return ordered.filter((a) => a.tags.includes(filter));
  }, [articles, popularIds, sort, filter]);

  const filterName = (tag: string) => (tag === '__general__' ? 'Geral' : label(tag));

  return (
    <section className="archive archive--table" id="edicoes" aria-labelledby="archive-heading">
      <div className="table-floor">
        <div className="table-card">
          <p className="eyebrow">A banca</p>
          <h2 id="archive-heading">Todas as edições</h2>
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
        </div>

        <p className="sr-only" aria-live="polite">{visible.length} {visible.length === 1 ? 'edição' : 'edições'}</p>

        <ul className="table-mags">
          {visible.length === 0 && <li className="empty">Nenhuma edição por aqui ainda.</li>}
          {visible.map((a, i) => {
            const ed = byId.get(a.postId)!;
            const s = scatter(a.id);
            return (
              <li key={a.postId} className="table-mag" style={{ ['--rot' as string]: `${s.rot}deg`, ['--dy' as string]: `${s.dy}px`, ['--dx' as string]: `${s.dx}px` }}>
                <button type="button" className="mag-hit" onClick={(e) => openEdition(a.postId, e.currentTarget)} aria-haspopup="dialog" aria-label={`${a.title}, ${ed.meta.dateLong}`}>
                  <span className="table-mag-body">
                    <Cover article={a} meta={ed.meta} eager={i < 4} />
                    <span className="mag-sheen" aria-hidden="true" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
