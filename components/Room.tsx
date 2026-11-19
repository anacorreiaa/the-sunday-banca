'use client';

import { useEffect, useRef } from 'react';
import { useEditions } from './Editions';

// Empty stretches of shelf in room.webp, as % of the image: [left, right, shelf line (bottom), book height].
// Filled in this order; the right-hand gap on the lower shelf sits behind a microphone, so it goes last.
const SLOTS: [number, number, number, number][] = [
  [33.9, 40.3, 29.8, 10.4],
  [57.8, 63.1, 29.8, 10.4],
  [64.5, 69.0, 15.1, 9.8],
  [24.4, 31.3, 15.1, 9.8],
  [50.9, 55.1, 15.1, 9.8],
  [76.6, 80.0, 15.1, 9.8],
  [77.0, 80.0, 29.8, 10.4],
];
const SPINE_W = 2.05; // % of image width
const SPINE_COLORS = ['#4E5D68', '#9A6C45', '#7D3D33', '#7D8E95', '#5B2F22', '#B9C6CC', '#E6DFD3'];
const LIGHT = new Set(['#B9C6CC', '#E6DFD3']);

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
      <div className="room-head">
        <p className="eyebrow">The Sunday Talks</p>
        <h2 id="room-heading">Puxe uma poltrona.</h2>
        <p className="room-lead">Na estante, as nossas edições, entre os livros da casa. Toque em uma lombada para abrir. Nas poltronas, em breve, o nosso podcast.</p>
      </div>
      <div className="room-scroller" ref={scrollerRef}>
        <div className="room-canvas">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="room-img" src="assets/scene/room.webp" alt="Estante de madeira cheia de livros, duas poltronas, uma azul e uma branca, com microfones de podcast e uma mesinha com hortênsias" />
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
