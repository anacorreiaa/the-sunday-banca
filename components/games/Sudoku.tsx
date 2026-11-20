'use client';

// Sudoku: a fresh grid each time, with a unique solution. Pick a square, then a number.
import GameTimer from './GameTimer';
import Celebrate from './Celebrate';
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

const MAX_ERRORS = 5;
const PREF = 'sunday-sudoku-limit';
const peers = (i: number) => {
  const r = Math.floor(i / 9), c = i % 9, br = r - (r % 3), bc = c - (c % 3);
  const out: number[] = [];
  for (let k = 0; k < 9; k++) out.push(r * 9 + k, k * 9 + c, (br + Math.floor(k / 3)) * 9 + bc + (k % 3));
  return out.filter((j) => j !== i);
};

const unitsOf = (i: number) => {
  const r = Math.floor(i / 9), c = i % 9, br = r - (r % 3), bc = c - (c % 3);
  return [
    Array.from({ length: 9 }, (_, k) => r * 9 + k),
    Array.from({ length: 9 }, (_, k) => k * 9 + c),
    Array.from({ length: 9 }, (_, k) => (br + Math.floor(k / 3)) * 9 + bc + (k % 3)),
  ];
};

export default function Sudoku() {
  const [level, setLevel] = useState(0);
  const [game, setGame] = useState<{ sol: number[]; puzzle: number[] } | null>(null);
  const [cells, setCells] = useState<number[]>([]);
  const [notes, setNotes] = useState<number[][]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [pencil, setPencil] = useState(false);
  const [limit, setLimit] = useState(false);
  const [errors, setErrors] = useState(0);
  const [round, setRound] = useState(0);
  const [shake, setShake] = useState<{ i: number; t: number } | null>(null);
  const [flash, setFlash] = useState<{ cells: Map<number, number>; t: number } | null>(null);

  useEffect(() => {
    try { setLimit(localStorage.getItem(PREF) === '1'); } catch {}
  }, []);
  const toggleLimit = () => {
    setLimit((v) => {
      try { localStorage.setItem(PREF, v ? '0' : '1'); } catch {}
      return !v;
    });
    setErrors(0);
  };

  const start = useCallback((lv: number) => {
    const g = make(LEVELS[lv].givens);
    setGame(g);
    setCells([...g.puzzle]);
    setNotes(Array.from({ length: 81 }, () => []));
    setSel(null);
    setErrors(0);
    setRound((r) => r + 1);
  }, []);
  useEffect(() => { start(level); }, [level, start]);
  const retry = () => {
    if (!game) return;
    setCells([...game.puzzle]);
    setNotes(Array.from({ length: 81 }, () => []));
    setErrors(0);
    setRound((r) => r + 1);
  };

  const lost = limit && errors >= MAX_ERRORS;

  const put = useCallback((n: number) => {
    if (sel === null || !game || game.puzzle[sel] || lost) return;
    if (pencil && n) {
      if (cells[sel]) return;
      setNotes((all) => {
        const x = [...all];
        x[sel] = x[sel].includes(n) ? x[sel].filter((v) => v !== n) : [...x[sel], n].sort();
        return x;
      });
      return;
    }
    if (n === 0) {
      setCells((c) => { const x = [...c]; x[sel] = 0; return x; });
      setNotes((all) => { const x = [...all]; x[sel] = []; return x; });
      return;
    }
    if (cells[sel] === n) return;
    const g = [...cells]; g[sel] = 0;
    const conflict = !ok(g, sel, n);
    const wrong = n !== game.sol[sel];
    setCells((c) => { const x = [...c]; x[sel] = n; return x; });
    setNotes((all) => {
      const x = [...all];
      x[sel] = [];
      if (!conflict) for (const j of peers(sel)) if (x[j].includes(n)) x[j] = x[j].filter((v) => v !== n);
      return x;
    });
    if (conflict || (limit && wrong)) setShake({ i: sel, t: Date.now() });
    if (!wrong) {
      const next = [...cells]; next[sel] = n;
      const done = new Map<number, number>();
      for (const unit of unitsOf(sel)) {
        if (unit.every((j) => next[j] === game.sol[j])) unit.forEach((j, k) => { if (!done.has(j)) done.set(j, k); });
      }
      if (done.size) setFlash({ cells: done, t: Date.now() });
    }
    if (limit && wrong) setErrors((e) => e + 1);
  }, [game, sel, pencil, cells, limit, lost]);

  useEffect(() => {
    if (!shake) return;
    const t = setTimeout(() => setShake(null), 450);
    return () => clearTimeout(t);
  }, [shake]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 1100);
    return () => clearTimeout(t);
  }, [flash]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (!(e.target as HTMLElement).closest?.('.sudoku')) return;
      if (e.key === 'n' || e.key === 'N') { setPencil((p) => !p); return; }
      if (sel === null) return;
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
  const isWrong = (i: number) => limit && !game.puzzle[i] && !!cells[i] && cells[i] !== game.sol[i];
  const sr = sel === null ? -1 : Math.floor(sel / 9), sc = sel === null ? -1 : sel % 9;
  const hasClash = cells.some((_, i) => clash(i));
  const finished = (n: number) => cells.every((v, i) => (game.sol[i] === n ? v === n : v !== n));

  let msg = '';
  if (solved) msg = 'Grade completa!!!';
  else if (lost) msg = 'Fim de jogo: 5 erros';
  else if (hasClash) msg = 'Esse número já aparece na linha, coluna ou quadrado';

  return (
    <div className="sudoku">
      <div className="game-bar">
        <div className="game-seg" role="group" aria-label="Nível">
          {LEVELS.map((l, i) => <button key={l.label} type="button" aria-pressed={level === i} onClick={() => setLevel(i)}>{l.label}</button>)}
        </div>
        <button type="button" className="game-btn" onClick={() => start(level)}>Nova grade</button>
      </div>
      <div className="sd-tools">
        <button type="button" className={`sd-tool${pencil ? ' is-on' : ''}`} aria-pressed={pencil} onClick={() => setPencil((p) => !p)} title="Atalho: tecla N">
          <span aria-hidden="true">✎</span> Rascunho {pencil ? 'ligado' : 'desligado'}
        </button>
        <button type="button" className={`sd-tool${limit ? ' is-on' : ''}`} role="switch" aria-checked={limit} onClick={toggleLimit}>
          <span className="sd-switch" aria-hidden="true" /> Máximo de {MAX_ERRORS} erros
        </button>
        <GameTimer running={!solved && !lost} resetKey={round} />
        {limit && <span className="sd-errors" aria-live="polite">Erros: {errors}/{MAX_ERRORS}</span>}
      </div>
      <div className={`sd-grid${solved ? ' is-solved' : ''}${lost ? ' is-lost' : ''}`} role="grid" aria-label="Sudoku">
        {cells.map((v, i) => {
          const r = Math.floor(i / 9), c = i % 9;
          const given = !!game.puzzle[i];
          const near = sel !== null && (r === sr || c === sc || (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3)));
          const bad = !given && (clash(i) || isWrong(i));
          const cls = `sd-cell${given ? ' is-given' : ''}${sel === i ? ' is-sel' : ''}${near ? ' is-near' : ''}${clash(i) ? ' is-clash' : ''}${bad ? ' is-bad' : ''}${v && sel !== null && v === cells[sel] ? ' is-same' : ''}${shake && shake.i === i ? ' is-shake' : ''}${flash?.cells.has(i) ? ' is-done' : ''}`;
          return (
            <button
              key={shake && shake.i === i ? `${i}-${shake.t}` : flash?.cells.has(i) ? `${i}-f${flash.t}` : i}
              style={flash?.cells.has(i) ? ({ '--d': `${flash.cells.get(i)! * 45}ms` } as React.CSSProperties) : undefined}
              type="button"
              className={cls}
              onClick={() => setSel(i)}
              aria-label={`Linha ${r + 1}, coluna ${c + 1}${v ? `, ${v}` : notes[i]?.length ? `, rascunho ${notes[i].join(' ')}` : ', vazia'}`}
            >
              {v ? v : notes[i]?.length ? (
                <span className="sd-notes" aria-hidden="true">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <span key={n}>{notes[i].includes(n) ? n : ''}</span>)}
                </span>
              ) : ''}
            </button>
          );
        })}
      </div>
      <div className={`sd-pad${pencil ? ' is-pencil' : ''}`}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
          const gone = finished(n);
          return <button key={n} type="button" className={gone ? 'is-gone' : ''} onClick={() => put(n)} disabled={lost || gone} aria-hidden={gone || undefined} tabIndex={gone ? -1 : undefined}>{n}</button>;
        })}
        <button type="button" onClick={() => put(0)} aria-label="Apagar" disabled={lost}>⌫</button>
      </div>
      <Celebrate on={solved} text="Você completou a grade!!!" />
      <p className={`pw-msg${hasClash && !solved && !lost ? ' sd-warn' : ''}`} aria-live="polite">{msg}</p>
      {lost && (
        <div className="game-bar sd-lost">
          <button type="button" className="game-btn" onClick={retry}>Tentar de novo</button>
          <button type="button" className="game-btn" onClick={() => start(level)}>Nova grade</button>
        </div>
      )}
    </div>
  );
}
