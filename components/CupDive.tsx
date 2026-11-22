'use client';

import { useEffect, useRef } from 'react';

// Where the coffee surface sits inside cup.webp (fractions of the image).
const COFFEE_Y = 0.13;
const COFFEE_X0 = 0.3;
const COFFEE_X1 = 0.7;

const LINES = ['Pegue um café.', 'Sente-se.', 'Mergulhe no domingo.'];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const easeIn = (t: number) => t * t;
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export default function CupDive() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cupRef = useRef<HTMLImageElement>(null);
  const poolRef = useRef<HTMLDivElement>(null);
  const d1 = useRef<HTMLImageElement>(null);
  const d2 = useRef<HTMLImageElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<(HTMLParagraphElement | null)[]>([]);
  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      section.classList.add('dive--static');
      return;
    }
    let raf = 0;

    const frame = () => {
      raf = 0;
      const stage = stageRef.current!, cup = cupRef.current!, pool = poolRef.current!;
      const rect = section.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = clamp(-rect.top / total);

      const sr = stage.getBoundingClientRect();
      const cr = cup.getBoundingClientRect();
      // The pool is the area above the coffee surface; anything below it is hidden "in the coffee".
      const coffeeY = cr.top - sr.top + cr.height * COFFEE_Y;
      const px0 = cr.left - sr.left + cr.width * COFFEE_X0;
      const px1 = cr.left - sr.left + cr.width * COFFEE_X1;
      pool.style.left = `${px0}px`;
      pool.style.width = `${px1 - px0}px`;
      pool.style.height = `${coffeeY}px`;

      const dh = d1.current!.offsetHeight || 300;
      const start = -dh - 40;
      const end = coffeeY + 20; // fully under the surface
      const f1 = easeIn(seg(p, 0.18, 0.62));
      const f2 = easeIn(seg(p, 0.24, 0.68));
      d1.current!.style.transform = `translateY(${start + (end - start) * f1}px) rotate(${(1 - f1) * -6}deg)`;
      d2.current!.style.transform = `translateY(${start + (end - start) * f2}px) rotate(${(1 - f2) * 5}deg)`;

      // Ripples when they hit the coffee.
      const hit = seg(p, 0.5, 0.82);
      rippleRef.current!.style.setProperty('--hit', hit.toFixed(3));
      rippleRef.current!.style.left = `${(px0 + px1) / 2}px`;
      rippleRef.current!.style.top = `${coffeeY}px`;
      rippleRef.current!.style.setProperty('--rw', `${px1 - px0}px`);

      LINES.forEach((_, i) => {
        const el = linesRef.current[i];
        if (!el) return;
        const a = 0.03 + i * 0.22;
        const o = seg(p, a, a + 0.06) * (1 - seg(p, a + 0.15, a + 0.21));
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translateY(${(1 - o) * 14}px)`;
      });

      // Final beat: the cup grows and the page turns to paper.
      const z = easeInOut(seg(p, 0.72, 0.9));
      cup.style.transform = `translateX(-50%) scale(${1 + z * 1.6})`;
      paperRef.current!.style.opacity = seg(p, 0.76, 0.86).toFixed(3);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    frame();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="dive" ref={sectionRef} aria-label="Pegue um café. Sente-se. Mergulhe no domingo.">
      <div className="dive-stage" ref={stageRef}>
        <div className="dive-lines" aria-hidden="true">
          {LINES.map((l, i) => (
            <p key={l} ref={(el) => { linesRef.current[i] = el; }} className={`dive-line dive-line--${i}`}>{l}</p>
          ))}
        </div>
        <div className="dive-pool" ref={poolRef} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={d1} className="diver diver--1" src="assets/scene/diver1.webp" alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={d2} className="diver diver--2" src="assets/scene/diver2.webp" alt="" />
        </div>
        <div className="dive-ripple" ref={rippleRef} aria-hidden="true"><span /><span /><span /></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={cupRef} className="dive-cup" src="assets/scene/cup.webp" alt="Xícara branca escrita The Sunday" />
        <div className="dive-paper" ref={paperRef} aria-hidden="true" />
      </div>
    </section>
  );
}
