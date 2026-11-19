'use client';

import { useEffect, useRef } from 'react';
import publication from '@/lib/publication.json';

// Positions are percentages of the hero; sizes are % of hero width (desktop) / (mobile).
type Item = { src: string; alt: string; x: number; y: number; w: number; r: number; mx: number; my: number; mw: number; mr: number };
const ITEMS: Item[] = [
  { src: 'magazines', alt: 'Três revistas The Sunday Magazine', x: 3, y: 4, w: 18, r: -2, mx: 1.5, my: 1.4, mw: 40, mr: 0 },
  { src: 'cup-blue', alt: 'Xícara de café azul', x: 27, y: 6, w: 14, r: 0, mx: 60, my: 4.6, mw: 31, mr: 0 },
  { src: 'toaster', alt: 'Torradeira com torrada quente', x: 47, y: 2, w: 11, r: 0, mx: 38, my: 11, mw: 26, mr: 0 },
  { src: 'vase', alt: 'Arranjo de flores verdes em vaso branco', x: 74, y: 3, w: 15, r: 0, mx: 64, my: 23, mw: 36, mr: 0 },
  { src: 'pajama', alt: 'Pijama listrado amarelo e branco', x: 88, y: 40, w: 9, r: 2, mx: 2, my: 37, mw: 23, mr: 0 },
  { src: 'boat', alt: 'Veleiro com vela xadrez azul e branca', x: 5, y: 50, w: 13, r: -2, mx: 2, my: 69, mw: 31, mr: 0 },
  { src: 'puzzles', alt: 'Livros de sudoku e caça-palavras', x: 23, y: 60, w: 15, r: -3, mx: 27.5, my: 71, mw: 34, mr: 0 },
  { src: 'berries', alt: 'Tigela de frutas vermelhas e mirtilos', x: 44, y: 64, w: 12, r: 0, mx: 56, my: 61, mw: 27, mr: 0 },
  { src: 'cards', alt: 'Cartas de baralho', x: 63, y: 60, w: 15, r: 3, mx: 65, my: 77, mw: 33, mr: 0 },
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
            <img src={`assets/drawn/${it.src}.webp`} alt="" draggable={false} />
          </button>
        ))}
        <h1 className="hero-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="assets/wordmark.svg" alt={publication.wordmark.alt} width={publication.wordmark.width} height={publication.wordmark.height} />
        </h1>
      </div>
      <p className="hero-hint" aria-hidden="true">role para mergulhar ↓</p>
    </section>
  );
}
