'use client';

import publication from '@/lib/publication.json';
import { gamesHref, homeHref, newsHref } from '@/lib/links';

type NavItem = { label: string; href?: string; filter?: string; page?: string };

/** Sticky top menu mirroring the Substack navigation. Tips/Edições jump to the editions table, already filtered. */
export default function SiteNav({ home = true, current }: { home?: boolean; current?: 'games' | 'news' | 'print' | 'about' }) {
  const items = (publication as unknown as { nav: NavItem[] }).nav;

  const go = (e: React.MouseEvent, it: NavItem) => {
    if (!it.filter || !home) return;
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('sunday:filter', { detail: it.filter }));
    document.getElementById('edicoes')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="sitenav" aria-label="Menu principal">
      <div className="sitenav-inner">
        <a className="sitenav-brand" href={home ? '#topo' : homeHref}>The Sunday</a>
        <ul className="sitenav-links">
          {items.map((it) => {
            const external = it.href?.startsWith('http');
            const href = it.page === 'games'
              ? gamesHref
              : it.page === 'news'
              ? newsHref
              : it.filter
                ? (home ? '#edicoes' : `${homeHref}?tema=${encodeURIComponent(it.filter)}#edicoes`)
                : it.href?.startsWith('#') && !home ? `${homeHref}${it.href}` : it.href;
            return (
              <li key={it.label}>
                <a
                  className={(it.page && it.page === current) || (current === 'print' && it.href === '/assinatura') || (current === 'about' && it.href === '/sobre') ? 'is-current' : undefined}
                  href={href}
                  onClick={(e) => go(e, it)}
                  {...(external ? { target: '_blank', rel: 'noopener' } : {})}
                >
                  {it.label}
                </a>
              </li>
            );
          })}
        </ul>
        <a className="sitenav-subscribe" href="/minha-assinatura">Minha assinatura</a>
      </div>
    </nav>
  );
}
