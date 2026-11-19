'use client';

import publication from '@/lib/publication.json';

type NavItem = { label: string; href?: string; filter?: string };

/** Sticky top menu mirroring the Substack navigation. Tips/Edições jump to the editions table, already filtered. */
export default function SiteNav() {
  const items = (publication as unknown as { nav: NavItem[] }).nav;

  const go = (e: React.MouseEvent, it: NavItem) => {
    if (!it.filter) return;
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('sunday:filter', { detail: it.filter }));
    document.getElementById('edicoes')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="sitenav" aria-label="Menu principal">
      <div className="sitenav-inner">
        <a className="sitenav-brand" href="#topo">The Sunday</a>
        <ul className="sitenav-links">
          {items.map((it) => {
            const external = it.href?.startsWith('http');
            return (
              <li key={it.label}>
                <a
                  href={it.filter ? '#edicoes' : it.href}
                  onClick={(e) => go(e, it)}
                  {...(external ? { target: '_blank', rel: 'noopener' } : {})}
                >
                  {it.label}
                </a>
              </li>
            );
          })}
        </ul>
        <a className="sitenav-subscribe" href={publication.subscribeUrl}>Assinar <span aria-hidden="true">↗</span></a>
      </div>
    </nav>
  );
}
