'use client';

import { useEffect, useRef } from 'react';
import publication from '@/lib/publication.json';

// Positions are percentages of the hero; sizes are % of hero width (desktop) / (mobile).
type Item = { src: string; alt: string; x: number; y: number; w: number; r: number; mx: number; my: number; mw: number; mr: number };
const ITEMS: Item[] = [
  { src: 'magazines', alt: 'Três revistas The Sunday Magazine', x: 4, y: 7, w: 20, r: -6, mx: 2, my: 5, mw: 34, mr: -8 },
  { src: 'cappuccino', alt: 'Cappuccino em xícara azul', x: 29, y: 6, w: 13, r: 3, mx: 62, my: 4, mw: 30, mr: 6 },
  { src: 'toaster', alt: 'Torradeira com torrada quente', x: 53, y: 3, w: 13, r: 5, mx: 38, my: 14, mw: 26, mr: 4 },
  { src: 'hydrangeas', alt: 'Hortênsias azuis em vaso de porcelana', x: 78, y: 5, w: 16, r: 6, mx: 68, my: 22, mw: 28, mr: 8 },
  { src: 'boat', alt: 'Veleiro com vela xadrez azul e branca', x: 4, y: 54, w: 15, r: -4, mx: -2, my: 64, mw: 30, mr: -6 },
  { src: 'puzzles', alt: 'Livros de sudoku e caça-palavras', x: 23, y: 63, w: 15, r: -7, mx: 26, my: 74, mw: 30, mr: -8 },
  { src: 'berries', alt: 'Tigela de frutas vermelhas e mirtilos', x: 42, y: 68, w: 13, r: 0, mx: 54, my: 66, mw: 26, mr: 2 },
  { src: 'cards', alt: 'Cartas de baralho', x: 60, y: 66, w: 15, r: 6, mx: 66, my: 84, mw: 30, mr: 7 },
  { src: 'pajama', alt: 'Pijama listrado azul e branco', x: 82, y: 48, w: 11, r: 8, mx: 4, my: 36, mw: 18, mr: -6 },
];

export default function Hero() {
  const ref = useRef<HTMLElement>(null);

  // Gentle parallax that follows the pointer (skipped for reduced motion and touch).
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(pointer: fine)').matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        el.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
    };
    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, []);

  const wiggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const b = e.currentTarget;
    b.classList.remove('wiggle');
    void b.offsetWidth; // restart the animation
    b.classList.add('wiggle');
  };

  return (
    <section className="hero" ref={ref} aria-label={publication.name}>
      <header className="topbar topbar--dark">
        <a className="topbar-author" href={publication.substackUrl}>{publication.author}</a>
        <span className="topbar-center">Uma publicação no Substack</span>
        <a className="topbar-subscribe" href={publication.subscribeUrl}>Assinar <span aria-hidden="true">↗</span></a>
      </header>
      <div className="hero-stage">
        {ITEMS.map((it, i) => (
          <button
            key={it.src}
            type="button"
            className="sticker"
            onClick={wiggle}
            aria-label={it.alt}
            style={{
              ['--x' as string]: `${it.x}%`,
              ['--y' as string]: `${it.y}%`,
              ['--w' as string]: `${it.w}%`,
              ['--r' as string]: `${it.r}deg`,
              ['--mx' as string]: `${it.mx}%`,
              ['--my' as string]: `${it.my}%`,
              ['--mw' as string]: `${it.mw}%`,
              ['--mr' as string]: `${it.mr}deg`,
              ['--depth' as string]: (0.6 + (i % 3) * 0.35).toFixed(2),
              ['--delay' as string]: `${120 + i * 70}ms`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`assets/scene/${it.src}.webp`} alt="" draggable={false} />
          </button>
        ))}
        <h1 className="hero-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="assets/wordmark-light.svg" alt={publication.wordmark.alt} width={publication.wordmark.width} height={publication.wordmark.height} />
        </h1>
      </div>
      <p className="hero-hint" aria-hidden="true">role para mergulhar ↓</p>
    </section>
  );
}
