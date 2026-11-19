'use client';

// Sudoku: a fresh grid each time, with a unique solution. Pick a square, then a number.
import { useCallback, useEffect, useState } from 'react';

const LEVELS = [
  { label: 'Fácil', givens: 40 },
  { label: 'Médio', givens: 32 },
  { label: 'Difícil', givens: 27 },
];

function shuffle<T>(a: T[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const ok = (g: number[], i: number, n: number) => {
  const r = Math.floor(i / 9), c = i % 9, br = r - (r % 3), bc = c - (c % 3);
  for (let k = 0; k < 9; k++) {
    if (g[r * 9 + k] === n || g[k * 9 + c] === n) return false;
    if (g[(br + Math.floor(k / 3)) * 9 + bc + (k % 3)] === n) return false;
  }
  return true;
};
function fill(g: number[]): boolean {
  const i = g.indexOf(0);
  if (i < 0) return true;
  for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (ok(g, i, n)) { g[i] = n; if (fill(g)) return true; g[i] = 0; }
  }
  return false;
}
function countSolutions(g: number[], limit = 2): number {
  const i = g.indexOf(0);
  if (i < 0) return 1;
  let n = 0;
  for (let v = 1; v <= 9 && n < limit; v++) {
    if (ok(g, i, v)) { g[i] = v; n += countSolutions(g, limit - n); g[i] = 0; }
  }
  return n;
}
function make(givens: number) {
  const sol = Array(81).fill(0);
  fill(sol);
  const puzzle = [...sol];
  let filled = 81;
  for (const i of shuffle(Array.from({ length: 81 }, (_, k) => k))) {
    if (filled <= givens) break;
    const keep = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions([...puzzle]) !== 1) puzzle[i] = keep;
    else filled--;
  }
  return { sol, puzzle };
}

export default function Sudoku() {
  const [level, setLevel] = useState(0);
  const [game, setGame] = useState<{ sol: number[]; puzzle: number[] } | null>(null);
  const [cells, setCells] = useState<number[]>([]);
  const [sel, setSel] = useState<number | null>(null);

  const start = useCallback((lv: number) => {
    const g = make(LEVELS[lv].givens);
    setGame(g);
    setCells([...g.puzzle]);
    setSel(null);
  }, []);
  useEffect(() => { start(level); }, [level, start]);

  const put = useCallback((n: number) => {
    if (sel === null || !game || game.puzzle[sel]) return;
    setCells((c) => { const x = [...c]; x[sel] = n; return x; });
  }, [game, sel]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (sel === null || !(e.target as HTMLElement).closest?.('.sudoku')) return;
      if (/^[1-9]$/.test(e.key)) put(Number(e.key));
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') put(0);
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const d = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key] || 0;
        setSel((s) => (s === null ? 0 : Math.min(80, Math.max(0, s + d))));
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [put, sel]);

  if (!game) return <p className="game-note">Preparando a grade…</p>;
  const solved = cells.every((v, i) => v === game.sol[i]);
  const clash = (i: number) => {
    const v = cells[i];
    if (!v) return false;
    const g = [...cells]; g[i] = 0;
    return !ok(g, i, v);
  };
  const sr = sel === null ? -1 : Math.floor(sel / 9), sc = sel === null ? -1 : sel % 9;

  return (
    <div className="sudoku">
      <div className="game-bar">
        <div className="game-seg" role="group" aria-label="Nível">
          {LEVELS.map((l, i) => <button key={l.label} type="button" aria-pressed={level === i} onClick={() => setLevel(i)}>{l.label}</button>)}
        </div>
        <button type="button" className="game-btn" onClick={() => start(level)}>Nova grade</button>
      </div>
      <div className={`sd-grid${solved ? ' is-solved' : ''}`} role="grid" aria-label="Sudoku">
        {cells.map((v, i) => {
          const r = Math.floor(i / 9), c = i % 9;
          const given = !!game.puzzle[i];
          const near = sel !== null && (r === sr || c === sc || (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3)));
          return (
            <button
              key={i}
              type="button"
              className={`sd-cell${given ? ' is-given' : ''}${sel === i ? ' is-sel' : ''}${near ? ' is-near' : ''}${clash(i) ? ' is-clash' : ''}${v && sel !== null && v === cells[sel] ? ' is-same' : ''}`}
              onClick={() => setSel(i)}
              aria-label={`Linha ${r + 1}, coluna ${c + 1}${v ? `, ${v}` : ', vazia'}`}
            >
              {v || ''}
            </button>
          );
        })}
      </div>
      <div className="sd-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <button key={n} type="button" onClick={() => put(n)}>{n}</button>)}
        <button type="button" onClick={() => put(0)} aria-label="Apagar">⌫</button>
      </div>
      <p className="pw-msg" aria-live="polite">{solved ? 'Grade completa ♡' : ''}</p>
    </div>
  );
}
