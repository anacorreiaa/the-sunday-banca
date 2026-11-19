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
        minWidth: 260,
        maxWidth: 520,
        minHeight: 360,
        maxHeight: 710,
        showCover: false,
        maxShadowOpacity: 0.35,
        mobileScrollSupport: true,
        usePortrait: true,
        flippingTime: 800,
        drawShadow: true,
      });
      pf.loadFromHTML(bookRef.current.querySelectorAll('.mag-page'));
      pf.on('flip', (e: { data: number }) => setPage(e.data));
      flipRef.current = pf as never;
      setCount(pf.getPageCount());
    })();
    return () => {
      cancelled = true;
      try { flipRef.current?.destroy(); } catch {}
    };
  }, []);

  const pages: React.ReactNode[] = [];
  pages.push(
    <div className="mag-page mag-page--cover" key="cover">
      <div className="mp-inner mp-cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="mp-cover-logo" src="assets/wordmark-light.svg" alt="The Sunday Magazine" />
        <p className="mp-cover-kicker">Edição especial</p>
        <p className="mp-cover-title">Quem somos</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="mp-cover-art" src="assets/drawn/cup-blue.webp" alt="" />
        <p className="mp-cover-foot">Arraste o canto da página para folhear →</p>
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
    <div className="mag-page mp--linho" key="how">
      <div className="mp-inner">
        <h3 className="mp-h">{about.how.title}</h3>
        <p className="mp-body">{about.how.lead}</p>
        <dl className="mp-list">
          {about.how.items.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        <p className="mp-body">{about.how.close}</p>
        <p className="mp-sign">{about.signoff}</p>
      </div>
    </div>,
    <div className="mag-page mp--papel" key="contents">
      <div className="mp-inner">
        <h3 className="mp-h">Nesta revista</h3>
        <ol className="mp-toc">
          {list.map((e) => (
            <li key={e.article.postId}>
              <span className="mp-toc-label">{e.meta.label}</span>
              <span className="mp-toc-title">{e.article.title}</span>
            </li>
          ))}
        </ol>
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
          {trimTo(e.meta.excerpt, 330).map((t, i) => <p key={i} className="mp-body mp-body--small">{t}</p>)}
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
    <section className="flip" aria-labelledby="flip-heading">
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
