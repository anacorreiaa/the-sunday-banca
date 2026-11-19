'use client';

// The newsletter home, Substack style: masthead, the newest post up front, the next ones beside it, then everything.
import { useMemo, useState } from 'react';

type Post = { id: string; title: string; subtitle: string; url: string; photo: string | null; date: string; series: string; tags: string[] };

export default function NewsletterList({ posts, subscribeUrl, labels }: { posts: Post[]; subscribeUrl: string; labels: Record<string, string> }) {
  const tags = useMemo(() => {
    const seen = new Map<string, number>();
    posts.forEach((p) => p.tags.forEach((t) => seen.set(t, (seen.get(t) || 0) + 1)));
    return [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [posts]);
  const [tag, setTag] = useState<string | null>(null);
  const list = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;
  const [lead, ...rest] = list;
  const side = tag ? [] : rest.slice(0, 4);
  const more = tag ? rest : rest.slice(4);
  const name = (t: string) => labels[t] || t;

  return (
    <div className="news">
      <header className="news-mast">
        <h1 className="news-logo">The Sunday Magazine</h1>
        <p className="news-tag">Uma newsletter para mulheres curiosas, todo domingo.</p>
        <a className="news-sub" href={subscribeUrl}>Assinar grátis</a>
      </header>

      <nav className="news-tabs" aria-label="Filtrar publicações">
        <button type="button" aria-pressed={!tag} onClick={() => setTag(null)}>Mais recentes</button>
        {tags.map((t) => <button key={t} type="button" aria-pressed={tag === t} onClick={() => setTag(t)}>{name(t)}</button>)}
      </nav>

      {lead && (
        <section className={`news-top${side.length ? '' : ' news-top--solo'}`}>
          <a className="news-lead" href={lead.url}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {lead.photo && <img src={lead.photo} alt="" />}
            <h2>{lead.title}</h2>
            {lead.subtitle && <p className="news-subtitle">{lead.subtitle}</p>}
            <p className="news-meta">{lead.date} · The Sunday Magazine</p>
          </a>
          {side.length > 0 && (
            <ul className="news-side">
              {side.map((p) => (
                <li key={p.id}>
                  <a href={p.url}>
                    <span className="news-side-text">
                      <span className="news-side-title">{p.title}</span>
                      {p.subtitle && <span className="news-subtitle">{p.subtitle}</span>}
                      <span className="news-meta">{p.date} · The Sunday Magazine</span>
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.photo && <img src={p.photo} alt="" loading="lazy" />}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {more.length > 0 && (
        <section className="news-all" aria-labelledby="news-all-h">
          <h3 id="news-all-h">{tag ? name(tag) : 'Todas as publicações'}</h3>
          <ul>
            {more.map((p) => (
              <li key={p.id}>
                <a href={p.url}>
                  <span className="news-side-text">
                    <span className="news-side-title">{p.title}</span>
                    {p.subtitle && <span className="news-subtitle">{p.subtitle}</span>}
                    <span className="news-meta">{p.date} · The Sunday Magazine</span>
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.photo && <img src={p.photo} alt="" loading="lazy" />}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <aside className="news-box">
        <p className="news-box-title">Toda semana, no seu e-mail.</p>
        <p>Uma conversa de domingo sobre o que vale a pena saber: comportamento, cultura, finanças, arte e as pequenas descobertas da vida adulta.</p>
        <a className="news-sub" href={subscribeUrl}>Assinar grátis</a>
      </aside>
    </div>
  );
}
