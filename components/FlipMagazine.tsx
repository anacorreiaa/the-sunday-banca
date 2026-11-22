'use client';

import { useEffect, useRef, useState } from 'react';
import about from '@/lib/about.json';
import publication from '@/lib/publication.json';
import { useEditions } from './Editions';
import { cleanSubtitle } from '@/lib/editions';

const MAX_EDITIONS = 8;

function trimTo(paras: string[], max: number) {
  const out: string[] = [];
  let n = 0;
  for (const p of paras) {
    if (n + p.length <= max) {
      out.push(p);
      n += p.length;
    } else {
      const room = max - n;
      if (room > 80) out.push(p.slice(0, p.lastIndexOf(' ', room)) + '…');
      break;
    }
  }
  return out;
}

/**
 * Shrinks each page's content until nothing is cut off at the bottom.
 * Uses transform: scale (works the same in Safari and Chrome): the content is laid out
 * on a bigger sheet (page size ÷ scale) and then scaled down to the page.
 * Pages that are not on screen are measured in an invisible copy of the same size.
 */
const FIT_PROPS = ['width', 'height', 'transform', 'transform-origin', 'zoom'];
function applyFit(el: HTMLElement, fit: number, H: number) {
  if (fit >= 1) { FIT_PROPS.forEach((k) => el.style.removeProperty(k)); return; }
  el.style.removeProperty('zoom');
  el.style.setProperty('width', `${100 / fit}%`);
  el.style.setProperty('height', `${H / fit}px`);
  el.style.setProperty('transform', `scale(${fit})`);
  el.style.setProperty('transform-origin', '0 0');
}
function fitPages(root: HTMLElement | null) {
  if (!root) return;
  const pages = [...root.querySelectorAll<HTMLElement>('.mag-page')];
  const shown = pages.find((p) => p.offsetWidth > 0 && p.offsetHeight > 0);
  if (!shown) return;
  const W = shown.offsetWidth, H = shown.offsetHeight;
  const MIN_FIT = W < 260 ? 0.3 : 0.55;
  const probe = document.createElement('div');
  probe.style.cssText = `position:fixed;left:-9999px;top:0;width:${W}px;height:${H}px;visibility:hidden;pointer-events:none;`;
  document.body.appendChild(probe);
  for (const page of pages) {
    const inner = page.querySelector<HTMLElement>('.mp-inner');
    if (!inner) continue;
    const copy = page.cloneNode(true) as HTMLElement;
    copy.removeAttribute('style');
    copy.style.cssText = 'position:absolute;inset:0;display:block;width:100%;height:100%;overflow:hidden;';
    probe.replaceChildren(copy);
    const el = copy.querySelector<HTMLElement>('.mp-inner')!;
    applyFit(el, 1, H);
    let fit = 1;
    for (let k = 0; k < 14; k++) {
      const over = el.scrollHeight - el.clientHeight;
      if (over <= 1 || fit <= MIN_FIT) break;
      fit = Math.max(MIN_FIT, fit * Math.min(0.96, el.clientHeight / el.scrollHeight));
      applyFit(el, fit, H);
    }
    applyFit(inner, fit, H);
  }
  probe.remove();
}

export default function FlipMagazine() {
  const { editions } = useEditions();
  const bookRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<{ flipNext: () => void; flipPrev: () => void; destroy: () => void; getCurrentPageIndex: () => number; getPageCount: () => number } | null>(null);
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const list = editions.slice(0, MAX_EDITIONS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { PageFlip } = await import('page-flip');
      if (cancelled || !bookRef.current) return;
      const pf = new PageFlip(bookRef.current, {
        width: 420,
        height: 560,
        size: 'stretch' as never,
        minWidth: 140,
        maxWidth: 420,
        minHeight: 187,
        maxHeight: 560,
        showCover: false,
        maxShadowOpacity: 0.35,
        mobileScrollSupport: true,
        usePortrait: false, // always two pages side by side, also on phones
        flippingTime: 800,
        drawShadow: true,
      });
      pf.loadFromHTML(bookRef.current.querySelectorAll('.mag-page'));
      pf.on('flip', (e: { data: number }) => setPage(e.data));
      flipRef.current = pf as never;
      setCount(pf.getPageCount());
      requestAnimationFrame(() => fitPages(bookRef.current));
    })();
    return () => {
      cancelled = true;
      try { flipRef.current?.destroy(); } catch {}
    };
  }, []);

  // Re-fit when the window changes size, when photos arrive and when the fonts finish loading.
  useEffect(() => {
    const root = bookRef.current;
    let t: ReturnType<typeof setTimeout>;
    const later = () => { clearTimeout(t); t = setTimeout(() => fitPages(bookRef.current), 120); };
    window.addEventListener('resize', later);
    root?.addEventListener('load', later, true);
    document.fonts?.ready.then(later);
    later();
    return () => { window.removeEventListener('resize', later); root?.removeEventListener('load', later, true); clearTimeout(t); };
  }, [list.length]);

  const pages: React.ReactNode[] = [];
  pages.push(
    <div className="mag-page mag-page--cover mag-page--photo" key="cover">
      <div className="mp-inner mp-cover mp-cover--photo">
        <div className="mp-cover-top">
          <p className="mp-cover-mast">The Sunday</p>
          <p className="mp-cover-tag">Para mulheres curiosas</p>
          <p className="mp-cover-line">Edição especial</p>
        </div>
        <div className="mp-cover-bottom">
          <p className="mp-cover-title">Quem somos</p>
          <p className="mp-cover-sub">Pull up a chair, a mesa está posta.</p>
          <p className="mp-cover-foot">Arraste o canto da página para folhear →</p>
        </div>
      </div>
    </div>,
    <div className="mag-page mp--papel" key="intro">
      <div className="mp-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="mp-photo" src="assets/mood/safari.webp" alt="" loading="lazy" />
        <p className="mp-kicker">{about.kicker}</p>
        {about.intro.map((t) => <p key={t} className="mp-body">{t}</p>)}
      </div>
    </div>,
    <div className="mag-page mp--manteiga" key="why">
      <div className="mp-inner">
        <h3 className="mp-h">{about.why.title}</h3>
        <p className="mp-body mp-body--lead">{about.why.text}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="mp-spot" src="assets/drawn/toaster.webp" alt="" />
      </div>
    </div>,
    <div className="mag-page mp--oliva" key="table">
      <div className="mp-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="mp-photo" src="assets/mood/limoes.webp" alt="" loading="lazy" />
        <h3 className="mp-h">{about.table.title}</h3>
        <p className="mp-body">{about.table.lead}</p>
        <dl className="mp-list">
          {about.table.items.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
      </div>
    </div>,
  );
  list.forEach((e, idx) => {
    const sub = cleanSubtitle(e.article.subtitle);
    pages.push(
      <div className={`mag-page ${idx % 2 ? 'mp--linho' : 'mp--papel'}`} key={e.article.postId}>
        <div className="mp-inner mp-ed">
          <p className="mp-ed-line"><span>{e.meta.label}</span><span>{e.meta.dateShort}</span></p>
          {e.meta.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="mp-ed-photo" src={e.meta.photo} alt="" loading="lazy" />
          )}
          <h3 className="mp-ed-title">{e.article.title}</h3>
          {sub && <p className="mp-ed-sub">{sub}</p>}
          {trimTo(e.meta.excerpt, 230).map((t, i) => <p key={i} className="mp-body mp-body--small">{t}</p>)}
          <a className="mp-more" href={e.article.url} target="_blank" rel="noopener">Continue lendo no Substack ↗</a>
        </div>
      </div>,
    );
  });
  // Spreads: keep the total even so the last spread is full.
  if ((pages.length + 1) % 2 === 1) {
    pages.push(
      <div className="mag-page mp--ardosia" key="question">
        <div className="mp-inner mp-question">
          <p className="mp-kicker">The Sunday Question</p>
          <p className="mp-body mp-body--lead">E você, sobre o que quer conversar no próximo domingo?</p>
          <a className="mp-more" href="#sugestoes">Deixe sua sugestão ↓</a>
        </div>
      </div>,
    );
  }
  pages.push(
    <div className="mag-page mag-page--cover" key="back">
      <div className="mp-inner mp-cover mp-back">
        <p className="mp-cover-title">{about.signoff}</p>
        <a className="mp-subscribe" href={publication.printMagazine.url} target="_blank" rel="noopener">Quero a revista física ↗</a>
        <a className="mp-subscribe" href={publication.subscribeUrl}>Assinar a newsletter ↗</a>
      </div>
    </div>,
  );

  return (
    <section className="flip" id="quem-somos" aria-labelledby="flip-heading">
      <div className="flip-head">
        <p className="eyebrow">Quem somos</p>
        <h2 id="flip-heading">Folheie a revista</h2>
      </div>
      <div className="flip-desk">
        <div className="flip-book-wrap">
          <div className="flip-stack flip-stack--l" aria-hidden="true" />
          <div className="flip-stack flip-stack--r" aria-hidden="true" />
          <div className="flip-book" ref={bookRef}>{pages}</div>
          <div className="flip-gutter" aria-hidden="true" />
        </div>
      </div>
      <div className="flip-controls">
        <button type="button" onClick={() => flipRef.current?.flipPrev()} disabled={page === 0} aria-label="Página anterior">←</button>
        <span aria-live="polite">{count ? `${page + 1} / ${count}` : ''}</span>
        <button type="button" onClick={() => flipRef.current?.flipNext()} disabled={count > 0 && page >= count - 1} aria-label="Próxima página">→</button>
      </div>
    </section>
  );
}
