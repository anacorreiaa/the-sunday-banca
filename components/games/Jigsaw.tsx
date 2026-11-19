'use client';

// A real jigsaw: interlocking pieces cut from the month's photo (public/assets/puzzle.webp, made from /quebra-cabeca).
// Drag pieces onto the board; a piece close to its place clicks into it.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import muralPhotos from '@/lib/mural.json';

// The month's puzzle photo first, then every photo on the mural: changing the mural changes these too.
const PHOTOS = ['assets/puzzle.webp', ...(muralPhotos as string[])];
const SIZES = [
  { label: '12 peças', cols: 3, rows: 4 },
  { label: '20 peças', cols: 4, rows: 5 },
  { label: '48 peças', cols: 6, rows: 8 },
];

type Piece = { r: number; c: number; x: number; y: number; z: number; done: boolean; path: Path2D; canvas: HTMLCanvasElement | null };

/** One edge with a classic knob, from P to Q. dir: 1 tab out, -1 tab in, 0 flat. m: knob scale. */
function edge(p: Path2D, P: [number, number], Q: [number, number], dir: number, m: number) {
  const ax = Q[0] - P[0], ay = Q[1] - P[1];
  const nx = ay, ny = -ax; // outward normal (unnormalised, same length as the edge)
  const len = Math.hypot(ax, ay);
  const k = (m / len) * dir;
  const pt = (u: number, v: number): [number, number] => [P[0] + ax * u + nx * v * k, P[1] + ay * u + ny * v * k];
  if (!dir) { p.lineTo(Q[0], Q[1]); return; }
  const seg: number[][] = [
    [0.36, 0], // straight
    [0.41, 0, 0.44, 0.05, 0.41, 0.11], // neck
    [0.37, 0.2, 0.4, 0.3, 0.5, 0.3], // head, left
    [0.6, 0.3, 0.63, 0.2, 0.59, 0.11], // head, right
    [0.56, 0.05, 0.59, 0, 0.64, 0], // neck
  ];
  const a = pt(seg[0][0], seg[0][1]);
  p.lineTo(a[0], a[1]);
  for (const s of seg.slice(1)) {
    const c1 = pt(s[0], s[1]), c2 = pt(s[2], s[3]), e = pt(s[4], s[5]);
    p.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], e[0], e[1]);
  }
  p.lineTo(Q[0], Q[1]);
}

function piecePath(pw: number, ph: number, t: number, dirs: [number, number, number, number]) {
  const p = new Path2D();
  const m = Math.min(pw, ph);
  const o = t; // the piece sits inside a margin of t on every side
  p.moveTo(o, o);
  edge(p, [o, o], [o + pw, o], dirs[0], m);
  edge(p, [o + pw, o], [o + pw, o + ph], dirs[1], m);
  edge(p, [o + pw, o + ph], [o, o + ph], dirs[2], m);
  edge(p, [o, o + ph], [o, o], dirs[3], m);
  p.closePath();
  return p;
}

export default function Jigsaw() {
  const [size, setSize] = useState(0);
  const [photo, setPhoto] = useState(0);
  const IMG = PHOTOS[photo];
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [ghost, setGhost] = useState(true);
  const [won, setWon] = useState(false);
  const [count, setCount] = useState({ done: 0, total: 0 });
  const areaRef = useRef<HTMLDivElement>(null);
  const pieces = useRef<Piece[]>([]);
  const geo = useRef({ bw: 0, bh: 0, bx: 0, by: 0, pw: 0, ph: 0, t: 0, areaH: 0 });
  const [, force] = useState(0);
  const zTop = useRef(10);

  useEffect(() => {
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = IMG;
  }, [IMG]);

  /** Board size and where it sits in the play area (desktop: board left, loose pieces right; phone: pieces below). */
  const layout = useCallback(() => {
    const area = areaRef.current;
    if (!area || !img) return null;
    const W = area.clientWidth;
    const { cols, rows } = SIZES[size];
    const wide = W > 760;
    const ratio = img.naturalHeight / img.naturalWidth;
    const bw = wide ? Math.min(W * 0.42, 600 / ratio) : W - 24;
    const bh = bw * ratio;
    const pw = bw / cols, ph = bh / rows;
    const t = Math.min(pw, ph) * 0.32;
    const bx = wide ? 24 : 12;
    const by = 24;
    const trayH = wide ? 0 : Math.ceil((cols * rows) / Math.max(1, Math.floor((W - 24) / (pw * 0.98)))) * ph * 1.02 + 30;
    const areaH = wide ? bh + 48 : bh + 48 + trayH;
    return { W, bw, bh, bx, by, pw, ph, t, areaH, wide };
  }, [img, size]);

  const deal = useCallback(() => {
    const L = layout();
    if (!L || !img) return;
    const { cols, rows } = SIZES[size];
    const { W, bw, bh, bx, by, pw, ph, t, areaH, wide } = L;
    geo.current = { bw, bh, bx, by, pw, ph, t, areaH };
    const rnd = () => (Math.random() < 0.5 ? 1 : -1);
    const h = Array.from({ length: rows }, () => Array.from({ length: cols }, rnd));
    const v = Array.from({ length: rows }, () => Array.from({ length: cols }, rnd));
    const list: Piece[] = [];
    // Loose pieces: to the right of the board on wide screens, below it on phones.
    const trayX0 = wide ? bx + bw + 40 : 12;
    const trayX1 = wide ? W - pw - 12 : W - pw - 12;
    const trayY0 = wide ? 16 : by + bh + 34;
    const trayY1 = wide ? areaH - ph - 16 : areaH - ph - 16;
    const order = Array.from({ length: cols * rows }, (_, i) => i).sort(() => Math.random() - 0.5);
    order.forEach((idx, k) => {
      const r = Math.floor(idx / cols), c = idx % cols;
      const dirs: [number, number, number, number] = [
        r === 0 ? 0 : -h[r - 1][c],
        c === cols - 1 ? 0 : v[r][c],
        r === rows - 1 ? 0 : h[r][c],
        c === 0 ? 0 : -v[r][c - 1],
      ];
      // Spread loosely over the free wood, in a jittered grid so every piece can be grabbed.
      const n = cols * rows;
      const tw = Math.max(pw, trayX1 - trayX0 + pw), th = Math.max(ph, trayY1 - trayY0 + ph);
      const per = Math.max(1, Math.floor(tw / (pw * 0.98)));
      const lines = Math.ceil(n / per);
      const stepX = (tw - pw) / Math.max(1, per - 1);
      const stepY = wide ? Math.min(ph * 1.02, (th - ph) / Math.max(1, lines - 1)) : ph * 1.02;
      let x = trayX0 + (k % per) * stepX + (Math.random() - 0.5) * pw * 0.18;
      let y = trayY0 + Math.floor(k / per) * stepY + (Math.random() - 0.5) * ph * 0.18;
      x = Math.max(8, Math.min(x, W - pw - 8));
      y = Math.max(8, y);
      list.push({ r, c, x, y, z: k + 1, done: false, path: piecePath(pw, ph, t, dirs), canvas: null });
    });
    pieces.current = list;
    zTop.current = list.length + 1;
    setWon(false);
    setCount({ done: 0, total: list.length });
    force((n) => n + 1);
  }, [img, layout, size]);

  useEffect(() => { deal(); }, [deal]);

  // Paint each piece once its canvas exists.
  useLayoutEffect(() => {
    if (!img) return;
    const { pw, ph, t, bw, bh } = geo.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const p of pieces.current) {
      const cv = p.canvas;
      if (!cv || cv.dataset.painted === `${img.src}-${size}-${pw}`) continue;
      cv.width = Math.ceil((pw + 2 * t) * dpr);
      cv.height = Math.ceil((ph + 2 * t) * dpr);
      const ctx = cv.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save();
      ctx.clip(p.path);
      const sx = img.naturalWidth / bw, sy = img.naturalHeight / bh;
      ctx.drawImage(img, (p.c * pw - t) * sx, (p.r * ph - t) * sy, (pw + 2 * t) * sx, (ph + 2 * t) * sy, 0, 0, pw + 2 * t, ph + 2 * t);
      // Cardboard feel: light on the top-left of the cut, shade on the bottom-right.
      ctx.lineWidth = 2.2;
      ctx.translate(-0.8, -0.8);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.stroke(p.path);
      ctx.translate(1.6, 1.6);
      ctx.strokeStyle = 'rgba(40,25,15,0.35)';
      ctx.stroke(p.path);
      ctx.restore();
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = 'rgba(40,25,15,0.45)';
      ctx.stroke(p.path);
      cv.dataset.painted = `${img.src}-${size}-${pw}`;
    }
  });

  // Re-deal on a real resize (keeps it simple and every piece the right size).
  useEffect(() => {
    let w = areaRef.current?.clientWidth || 0;
    const on = () => {
      const nw = areaRef.current?.clientWidth || 0;
      if (Math.abs(nw - w) > 40) { w = nw; deal(); }
    };
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [deal]);

  const hit = useRef<CanvasRenderingContext2D | null>(null);
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (won) return;
    const area = areaRef.current!;
    const box = area.getBoundingClientRect();
    const px = e.clientX - box.left, py = e.clientY - box.top;
    const { t } = geo.current;
    hit.current ||= document.createElement('canvas').getContext('2d');
    const sorted = [...pieces.current].filter((p) => !p.done).sort((a, b) => b.z - a.z);
    const p = sorted.find((q) => hit.current!.isPointInPath(q.path, px - (q.x - t), py - (q.y - t)));
    if (!p) return;
    e.preventDefault();
    area.setPointerCapture(e.pointerId);
    p.z = ++zTop.current;
    const ox = px - p.x, oy = py - p.y;
    const el = p.canvas!;
    el.style.zIndex = String(p.z);
    el.classList.add('is-lifted');
    const move = (ev: PointerEvent) => {
      p.x = ev.clientX - box.left - ox;
      p.y = ev.clientY - box.top - oy;
      el.style.transform = `translate(${p.x - t}px, ${p.y - t}px)`;
    };
    const up = () => {
      area.removeEventListener('pointermove', move);
      area.removeEventListener('pointerup', up);
      area.removeEventListener('pointercancel', up);
      el.classList.remove('is-lifted');
      const { bx, by, pw, ph } = geo.current;
      const tx = bx + p.c * pw, ty = by + p.r * ph;
      if (Math.hypot(p.x - tx, p.y - ty) < Math.min(pw, ph) * 0.28) {
        p.x = tx; p.y = ty; p.done = true; p.z = 1;
        el.style.transform = `translate(${p.x - t}px, ${p.y - t}px)`;
        el.style.zIndex = '1';
        el.classList.add('is-placed');
        const done = pieces.current.filter((q) => q.done).length;
        setCount({ done, total: pieces.current.length });
        if (done === pieces.current.length) setWon(true);
      }
    };
    area.addEventListener('pointermove', move);
    area.addEventListener('pointerup', up);
    area.addEventListener('pointercancel', up);
  };

  const g = geo.current;
  return (
    <div className="jigsaw">
      <div className="game-bar">
        <div className="game-seg" role="group" aria-label="Tamanho">
          {SIZES.map((s, i) => (
            <button key={s.label} type="button" aria-pressed={size === i} onClick={() => setSize(i)}>{s.label}</button>
          ))}
        </div>
        <span className="game-count">{count.done} de {count.total} no lugar</span>
        <button type="button" className="game-btn" onClick={() => setGhost((x) => !x)} aria-pressed={ghost}>{ghost ? 'Esconder a imagem guia' : 'Mostrar a imagem guia'}</button>
        <button type="button" className="game-btn" onClick={deal}>Espalhar de novo</button>
      </div>
      <div className="jigsaw-photos" role="group" aria-label="Escolher a foto">
        {PHOTOS.map((src, i) => (
          <button key={src} type="button" aria-pressed={photo === i} onClick={() => setPhoto(i)} aria-label={i === 0 ? 'Foto do mês' : `Foto ${i} do mural`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      <div className="jigsaw-area" ref={areaRef} style={{ height: g.areaH || 520 }} onPointerDown={onDown}>
        <div className="jigsaw-board" style={{ left: g.bx, top: g.by, width: g.bw, height: g.bh }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {ghost && img && <img src={img.src} alt="" className="jigsaw-ghost" />}
        </div>
        {pieces.current.map((p) => (
          <canvas
            key={`${photo}-${size}-${p.r}-${p.c}-${g.pw}`}
            ref={(el) => { p.canvas = el; }}
            className={`jigsaw-piece${p.done ? ' is-placed' : ''}`}
            style={{ width: g.pw + 2 * g.t, height: g.ph + 2 * g.t, transform: `translate(${p.x - g.t}px, ${p.y - g.t}px)`, zIndex: p.z }}
            aria-hidden="true"
          />
        ))}
        {won && (
          <div className="jigsaw-won" role="status">
            <p>Pronto, você montou ♡</p>
            <button type="button" className="game-btn" onClick={() => setPhoto((p) => (p + 1) % PHOTOS.length)}>Próxima foto →</button>
          </div>
        )}
      </div>
      <p className="game-note">Arraste as peças para o quadro. Quando uma peça chega perto do lugar certo, ela se encaixa sozinha. Para montar outra imagem, escolha uma foto na faixa de cima.</p>
    </div>
  );
}
