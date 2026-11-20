'use client';

// A stopwatch for the games. It can be switched off; the choice is remembered for every game.
import { useEffect, useRef, useState } from 'react';

const PREF = 'sunday-timer';

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

/** running: the clock moves. resetKey: change it to start again from zero (a new grid). */
export default function GameTimer({ running, resetKey }: { running: boolean; resetKey: unknown }) {
  const [on, setOn] = useState(true);
  const [ms, setMs] = useState(0);
  const base = useRef(0); // time already counted before the current run
  const since = useRef<number | null>(null);

  useEffect(() => {
    try { setOn(localStorage.getItem(PREF) !== '0'); } catch {}
  }, []);

  useEffect(() => {
    base.current = 0;
    since.current = null;
    setMs(0);
  }, [resetKey]);

  useEffect(() => {
    if (!running) {
      if (since.current !== null) { base.current += Date.now() - since.current; since.current = null; }
      setMs(base.current);
      return;
    }
    since.current = Date.now();
    const id = setInterval(() => setMs(base.current + Date.now() - (since.current ?? Date.now())), 250);
    return () => {
      clearInterval(id);
      if (since.current !== null) { base.current += Date.now() - since.current; since.current = null; }
    };
  }, [running, resetKey]);

  const toggle = () => setOn((v) => {
    try { localStorage.setItem(PREF, v ? '0' : '1'); } catch {}
    return !v;
  });

  return (
    <span className="game-timer">
      <button type="button" className={`sd-tool${on ? ' is-on' : ''}`} role="switch" aria-checked={on} onClick={toggle}>
        <span className="sd-switch" aria-hidden="true" /> Cronômetro
      </button>
      {on && <span className="game-time" aria-label={`Tempo: ${fmt(ms)}`}>{fmt(ms)}</span>}
    </span>
  );
}
