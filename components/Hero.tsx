'use client';

import { useEffect, useRef } from 'react';
import publication from '@/lib/publication.json';

// Positions are percentages of the hero; sizes are % of hero width (desktop) / (mobile).
type Item = { src: string; alt: string; x: number; y: number; w: number; r: number; mx: number; my: number; mw: number; mr: number };
const ITEMS: Item[] = [
  { src: 'magazines', alt: 'Três revistas The Sunday Magazine', x: 3, y: 4, w: 18, r: -2, mx: 1, my: 1, mw: 30, mr: -3 },
  { src: 'cup-blue', alt: 'Xícara de café azul', x: 26, y: 5, w: 13, r: 0, mx: 55, my: 3, mw: 22, mr: 0 },
  { src: 'toaster', alt: 'Torradeira com torrada quente', x: 59, y: 3, w: 9, r: 0, mx: 33, my: 6, mw: 20, mr: 0 },
  { src: 'vase', alt: 'Arranjo de flores verdes em vaso branco', x: 74, y: 3, w: 15, r: 0, mx: 76, my: 3, mw: 23, mr: 0 },
  { src: 'pajama', alt: 'Pijama listrado amarelo e branco', x: 88, y: 40, w: 9, r: 2, mx: 61, my: 15, mw: 13, mr: 4 },
  { src: 'boat', alt: 'Veleiro com vela xadrez azul e branca', x: 5, y: 50, w: 13, r: -2, mx: 2, my: 72, mw: 24, mr: -2 },
  { src: 'puzzles', alt: 'Livros de sudoku e caça-palavras', x: 21, y: 62, w: 14, r: -3, mx: 27, my: 76, mw: 25, mr: -4 },
  { src: 'berries', alt: 'Tigela de frutas vermelhas e mirtilos', x: 45.5, y: 80, w: 9, r: 0, mx: 52, my: 77, mw: 19, mr: 0 },
  { src: 'cards', alt: 'Cartas de baralho', x: 65, y: 62, w: 14, r: 3, mx: 72, my: 74, mw: 26, mr: 4 },
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
    <section className="hero" id="topo" ref={ref} aria-label={publication.name}>
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
        <div className="hero-center">
          <h1 className="hero-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="assets/wordmark.svg" alt={publication.wordmark.alt} width={publication.wordmark.width} height={publication.wordmark.height} />
          </h1>
          <p className="hero-lead">{publication.printMagazine.lead}</p>
          <a className="print-cta" href={publication.printMagazine.url} target="_blank" rel="noopener">
            {publication.printMagazine.cta} <span aria-hidden="true">→</span>
          </a>
          <p className="print-note">{publication.printMagazine.note}</p>
        </div>
      </div>
      <p className="hero-hint" aria-hidden="true">role para mergulhar ↓</p>
    </section>
  );
}
