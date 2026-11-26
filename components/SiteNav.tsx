'use client';

import publication from '@/lib/publication.json';
import { useEffect, useRef, useState } from 'react';
import { gamesHref, homeHref, newsHref } from '@/lib/links';
import { blackFridayOn, BLACK_FRIDAY } from '@/lib/promo';

// The Christmas pre-sale bar disappears by itself after 1 December (São Paulo time).
const BF_ON = blackFridayOn();
const PRESALE_OPEN = Date.now() < Date.parse('2026-12-02T03:00:00Z');

type NavItem = { label: string; href?: string; filter?: string; page?: string };

/** Sticky top menu mirroring the Substack navigation. Tips/Edições jump to the editions table, already filtered. */
export default function SiteNav({ home = true, current }: { home?: boolean; current?: 'games' | 'news' | 'print' | 'about' }) {
  const items = (publication as unknown as { nav: NavItem[] }).nav;
  const navRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  // Publishes the menu's height (with the pre-sale bar) so other parts can stay clear of it.
  useEffect(() => {
    const el = navRef.current; if (!el) return;
    const set = () => document.documentElement.style.setProperty('--navh', `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = (e: React.MouseEvent, it: NavItem) => {
    if (!it.filter || !home) return;
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('sunday:filter', { detail: it.filter }));
    document.getElementById('edicoes')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="sitenav" aria-label="Menu principal" ref={navRef}>
      {PRESALE_OPEN && (
        <a className="presale-bar" href="/assinatura#planos">
          {BF_ON
            ? <span>Black Friday até 30/11: mensal por {BLACK_FRIDAY.mensal.price} + frete<span className="presale-more"> ✦ adesivos e marcador de brinde em todos os planos</span></span>
            : <span>Pré-venda de Natal até 01/12<span className="presale-more"> ✦ Frete grátis no semestral e no anual</span></span>}
        </a>
      )}
      <div className="sitenav-inner">
        <button type="button" className="sitenav-burger" aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{open ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M3 7h18M3 12h18M3 17h12" />}</svg>
        </button>
        <ul className={`sitenav-links${open ? ' is-open' : ''}`}>
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
                  onClick={(e) => { setOpen(false); go(e, it); }}
                  {...(external ? { target: '_blank', rel: 'noopener' } : {})}
                >
                  {it.label}
                </a>
              </li>
            );
          })}
        </ul>
        <a className="sitenav-brand" href={home ? '#topo' : homeHref}>The Sunday</a>
        <div className="sitenav-icons">
          <a href="/minha-assinatura" aria-label="Minha assinatura" title="Minha assinatura">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
          </a>
          <a href="/assinatura#planos" aria-label="Assinar" title="Assinar">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 13H6z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>
          </a>
        </div>
      </div>
    </nav>
  );
}
