'use client';

import { useEffect, useRef } from 'react';
import { useEditions } from './Editions';

// Empty stretches of shelf in room.webp, as % of the image: [left, right, shelf line (bottom), book height].
// Filled in this order; the right-hand gap on the lower shelf sits behind a microphone, so it goes last.
const SLOTS: [number, number, number, number][] = [
  [34.3, 40.4, 29.7, 10.4],
  [57.5, 63.2, 29.7, 10.4],
  [24.4, 31.2, 15.3, 10.2],
  [50.8, 55.0, 15.3, 10.2],
  [64.6, 69.0, 15.3, 10.2],
  [76.3, 81.0, 15.3, 10.2],
  [90.4, 95.0, 15.3, 10.2],
];
const SPINE_W = 2.05; // % of image width
const SPINE_COLORS = ['#8E2B2B', '#6E6B3F', '#CFAD64', '#9A6C45', '#E6DFD3', '#5B2F22', '#738691'];
const LIGHT = new Set(['#CFAD64', '#E6DFD3']);

function place(count: number) {
  const out: { left: number; bottom: number; h: number }[] = [];
  for (const [l, r, base, h] of SLOTS) {
    const fit = Math.floor((r - l) / SPINE_W);
    for (let i = 0; i < fit && out.length < count; i++) out.push({ left: l + i * SPINE_W, bottom: base, h: h * (0.86 + ((out.length * 37) % 13) / 100) });
    if (out.length >= count) break;
  }
  return out;
}

export default function Room() {
  const { editions, open } = useEditions();
  const spots = place(editions.length);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // On narrow screens the room is wider than the viewport: start centred on the shelf.
  useEffect(() => {
    const s = scrollerRef.current;
    if (s && s.scrollWidth > s.clientWidth) s.scrollLeft = (s.scrollWidth - s.clientWidth) * 0.55;
  }, []);

  return (
    <section className="room" aria-labelledby="room-heading">
      <div className="room-plaque">
        <h2 id="room-heading">The Sunday Talks</h2>
      </div>
      <p className="room-lead">As nossas edições estão na estante: toque em uma lombada para abrir. Nas poltronas, em breve, o nosso podcast.</p>
      <div className="room-scroller" ref={scrollerRef}>
        <div className="room-canvas">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="room-img" src="assets/scene/room.webp" alt="As duas fundadoras da The Sunday, de pijama listrado, rindo nas poltronas em frente a uma estante de livros, cada uma com um microfone de podcast" />
          <ul className="spines" aria-label="Edições na estante">
            {editions.slice(0, spots.length).map((e, i) => {
              const c = SPINE_COLORS[i % SPINE_COLORS.length];
              const s = spots[i];
              return (
                <li key={e.article.postId} style={{ left: `${s.left}%`, bottom: `${100 - s.bottom}%`, height: `${s.h}%`, width: `${SPINE_W - 0.15}%` }}>
                  <button
                    type="button"
                    className={`spine${LIGHT.has(c) ? ' spine--light' : ''}`}
                    style={{ ['--spine' as string]: c }}
                    onClick={(ev) => open(e.article.postId, ev.currentTarget)}
                    aria-haspopup="dialog"
                    aria-label={`${e.article.title}, ${e.meta.dateLong}`}
                  >
                    <span className="spine-band" aria-hidden="true" />
                    <span className="spine-title" aria-hidden="true">{e.article.title}</span>
                    <span className="spine-mark" aria-hidden="true">TS</span>
                    <span className="spine-tip" aria-hidden="true">{e.article.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
