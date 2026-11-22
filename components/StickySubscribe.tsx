'use client';
// Phones only: a small bar at the bottom that takes the reader to the plans.
// It hides while the plans or the delivery form are on screen.
import { useEffect, useState } from 'react';

export default function StickySubscribe() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const seen = new Set<Element>();
    const update = () => setShow(window.scrollY > 280 && seen.size === 0);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target));
      update();
    }, { threshold: 0.15 });
    const watch = () => document.querySelectorAll('#planos, #entrega').forEach((el) => io.observe(el));
    watch();
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', update, { passive: true });
    return () => { io.disconnect(); mo.disconnect(); window.removeEventListener('scroll', update); };
  }, []);
  return (
    <a className={`ps-sticky${show ? ' is-on' : ''}`} href="#planos" aria-hidden={!show} tabIndex={show ? 0 : -1}>
      <span>Assinar a The Sunday</span>
      <b>a partir de R$ 49,90 por edição</b>
    </a>
  );
}
