'use client';

import publication from '@/lib/publication.json';
import { gamesHref, homeHref, newsHref } from '@/lib/links';

// The Christmas pre-sale bar disappears by itself after 1 December (São Paulo time).
const PRESALE_OPEN = Date.now() < Date.parse('2026-12-02T03:00:00Z');

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
      {PRESALE_OPEN && (
        <a className="presale-bar" href="/assinatura#planos">
          <span className="presale-dot" aria-hidden="true" />
          <span><b>Pré-venda de Natal</b> até 1º de dezembro · Já garanta a sua edição de Natal</span>
          <span className="presale-go" aria-hidden="true">→</span>
        </a>
      )}
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
