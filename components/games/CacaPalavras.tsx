'use client';

// Caça-palavras: Sunday words hidden across, down and diagonally. Drag (or tap the first and last letter) to mark one.
import GameTimer from './GameTimer';
import Celebrate from './Celebrate';
import { useCallback, useEffect, useRef, useState } from 'react';

const POOL = ['DOMINGO', 'CAFE', 'LIVRO', 'MESA', 'CONVERSA', 'CURIOSA', 'REVISTA', 'VINHO', 'BOLO', 'ARTE', 'MUSEU', 'POEMA', 'VIAGEM', 'JANTAR', 'PIANO', 'FLORES', 'CARTA', 'AMIGAS', 'RECEITA', 'CINEMA'];
const N = 12;
const DIRS = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
const COLORS = ['#cfad64', '#9aa07a', '#c49a6c', '#b9c6cc', '#d6a59a', '#e0cf8a', '#a9b7a0', '#d9b48f'];
const ABC = 'ABCDEFGHIJLMNOPQRSTUVXZ';

type Placed = { word: string; cells: number[] };

function build() {
  for (let attempt = 0; attempt < 50; attempt++) {
    const grid: string[] = Array(N * N).fill('');
    const words = [...POOL].sort(() => Math.random() - 0.5).slice(0, 9).sort((a, b) => b.length - a.length);
    const placed: Placed[] = [];
    let okAll = true;
    for (const w of words) {
      let done = false;
      for (let t = 0; t < 200 && !done; t++) {
        const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
        const r0 = Math.floor(Math.random() * N), c0 = Math.floor(Math.random() * N);
        const cells: number[] = [];
        for (let k = 0; k < w.length; k++) {
          const r = r0 + dr * k, c = c0 + dc * k;
          if (r < 0 || r >= N || c < 0 || c >= N) break;
          const i = r * N + c;
          if (grid[i] && grid[i] !== w[k]) break;
          cells.push(i);
        }
        if (cells.length === w.length) {
          cells.forEach((i, k) => (grid[i] = w[k]));
          placed.push({ word: w, cells });
          done = true;
        }
      }
      if (!done) { okAll = false; break; }
    }
    if (!okAll) continue;
    for (let i = 0; i < grid.length; i++) if (!grid[i]) grid[i] = ABC[Math.floor(Math.random() * ABC.length)];
    return { grid, placed };
  }
  return { grid: Array(N * N).fill('A'), placed: [] };
}

function line(a: number, b: number) {
  const r0 = Math.floor(a / N), c0 = a % N, r1 = Math.floor(b / N), c1 = b % N;
  const dr = Math.sign(r1 - r0), dc = Math.sign(c1 - c0);
  const len = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0));
  if (!(r0 === r1 || c0 === c1 || Math.abs(r1 - r0) === Math.abs(c1 - c0))) return [a];
  return Array.from({ length: len + 1 }, (_, k) => (r0 + dr * k) * N + c0 + dc * k);
}

export default function CacaPalavras() {
  const [game, setGame] = useState<{ grid: string[]; placed: Placed[] } | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [start, setStart] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const dragging = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => { setGame(build()); setFound([]); setStart(null); setHover(null); }, []);
  useEffect(() => { reset(); }, [reset]);

  const finish = useCallback((a: number, b: number) => {
    if (!game) return;
    const cells = line(a, b);
    const hit = game.placed.find((p) => !found.includes(p.word) && p.cells.length === cells.length && (p.cells.every((c, i) => c === cells[i]) || p.cells.every((c, i) => c === cells[cells.length - 1 - i])));
    if (hit) setFound((f) => [...f, hit.word]);
    setStart(null);
    setHover(null);
  }, [found, game]);

  const cellAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const v = el?.dataset?.cell;
    return v === undefined ? null : Number(v);
  };
  const onDown = (e: React.PointerEvent) => {
    const i = cellAt(e.clientX, e.clientY);
    if (i === null) return;
    if (start !== null && !dragging.current) { finish(start, i); return; } // second tap
    dragging.current = true;
    setStart(i);
    setHover(i);
    gridRef.current?.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const i = cellAt(e.clientX, e.clientY);
    if (i !== null) setHover(i);
  };
  const onUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const i = cellAt(e.clientX, e.clientY) ?? hover;
    if (start !== null && i !== null && i !== start) finish(start, i);
    // A plain tap leaves the first letter selected, waiting for the last one.
  };

  if (!game) return null;
  const sel = start !== null && hover !== null ? new Set(line(start, hover)) : new Set<number>();
  const colorOf = new Map<number, string>();
  game.placed.forEach((p, k) => { if (found.includes(p.word)) p.cells.forEach((c) => colorOf.set(c, COLORS[k % COLORS.length])); });
  const all = found.length === game.placed.length;

  return (
    <div className="caca">
      <div className="game-bar">
        <span className="game-count">{found.length} de {game.placed.length} palavras</span>
        <GameTimer running={!all} resetKey={game} />
        <button type="button" className="game-btn" onClick={reset}>Nova grade</button>
      </div>
      <div className="caca-wrap">
        <div ref={gridRef} className="caca-grid" style={{ ['--n' as string]: N }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} role="grid" aria-label="Caça-palavras">
          {game.grid.map((l, i) => (
            <span key={i} data-cell={i} className={`caca-cell${sel.has(i) ? ' is-sel' : ''}`} style={colorOf.has(i) ? { background: colorOf.get(i) } : undefined}>{l}</span>
          ))}
        </div>
        <ul className="caca-words">
          {game.placed.map((p) => <li key={p.word} className={found.includes(p.word) ? 'is-found' : ''}>{p.word.toLowerCase()}</li>)}
        </ul>
      </div>
      <p className="game-note">Arraste da primeira à última letra, ou toque nas duas. As palavras podem estar na horizontal, na vertical ou na diagonal, de trás para a frente também.</p>
      <Celebrate on={all} text="Você achou todas as palavras!!!" />
      <p className="pw-msg" aria-live="polite">{all ? 'Achou todas!!!' : ''}</p>
    </div>
  );
}
