'use client';

// Confetti and a little "parabéns" card when a game is finished.
// Fires only when `on` turns true while playing, not when a finished game is restored on load.
import { useEffect, useRef } from 'react';

const COLORS = ['#9a6c45', '#bfa865', '#4e5d68', '#8e2b2b', '#e6dfd3', '#c98b6b', '#7d8f6a', '#fffaf0'];

function burst(from: DOMRect) {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  const cx = from.left + from.width / 2, cy = from.top + Math.min(from.height / 2, H * 0.55);
  const N = W < 600 ? 110 : 170;
  const bits = Array.from({ length: N }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
    const v = 7 + Math.random() * 9;
    return {
      x: cx + (Math.random() - 0.5) * 40, y: cy,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3,
      w: 6 + Math.random() * 6, h: 9 + Math.random() * 8,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.35,
      flip: Math.random() * Math.PI, vf: 0.08 + Math.random() * 0.12,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      round: Math.random() < 0.25,
    };
  });
  const t0 = performance.now();
  const tick = (now: number) => {
    const t = now - t0;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = t > 2600 ? Math.max(0, 1 - (t - 2600) / 800) : 1;
    for (const b of bits) {
      b.vy += 0.28; b.vx *= 0.985; b.vy *= 0.985;
      b.x += b.vx; b.y += b.vy; b.r += b.vr; b.flip += b.vf;
      ctx.save();
      ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.scale(1, Math.cos(b.flip));
      ctx.fillStyle = b.c;
      if (b.round) { ctx.beginPath(); ctx.arc(0, 0, b.w / 2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    }
    if (t < 3400) requestAnimationFrame(tick); else canvas.remove();
  };
  requestAnimationFrame(tick);
}

function showCard(title: string, text?: string) {
  document.querySelectorAll('.celebrate-card').forEach((n) => n.remove());
  const card = document.createElement('div');
  card.className = 'celebrate-card';
  card.setAttribute('role', 'status');
  const h = document.createElement('p'); h.className = 'celebrate-title'; h.textContent = title; card.appendChild(h);
  if (text) { const t = document.createElement('p'); t.className = 'celebrate-text'; t.textContent = text; card.appendChild(t); }
  card.addEventListener('click', () => card.remove());
  document.body.appendChild(card);
  setTimeout(() => card.remove(), 3300);
}

export default function Celebrate({ on, title = 'Parabéns!', text }: { on: boolean; title?: string; text?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef<boolean | null>(null);

  useEffect(() => {
    const was = prev.current;
    prev.current = on;
    if (!on || was !== false) return; // first render, or already finished
    const host = ref.current?.parentElement;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (host && !reduce) burst(host.getBoundingClientRect());
    showCard(title, text);
  }, [on, title, text]);

  return <span ref={ref} hidden />;
}
