'use client';

// A puzzle box lying next to the editions table. Clicking it opens a sliding-swap puzzle of the month's photo
// (public/assets/puzzle.webp, made from the /quebra-cabeca folder). Tap one piece, then another, to swap them.
import { useCallback, useEffect, useRef, useState } from 'react';

const IMG = 'assets/puzzle.webp';

function shuffled(n: number) {
  const a = Array.from({ length: n * n }, (_, i) => i);
  do {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  } while (a.every((v, i) => v === i) || a.filter((v, i) => v === i).length > n);
  return a;
}

export function PuzzleBox() {
  const dlg = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [n, setN] = useState(4);
  const [tiles, setTiles] = useState<number[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [peek, setPeek] = useState(false);
  const solved = tiles.length > 0 && tiles.every((v, i) => v === i);

  const reset = useCallback((size: number) => {
    setN(size);
    setTiles(shuffled(size));
    setSel(null);
    setMoves(0);
  }, []);

  const open = () => {
    if (!tiles.length || solved) reset(n);
    dlg.current?.showModal();
  };
  const close = () => dlg.current?.close();

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    const onClose = () => opener.current?.focus();
    const onClick = (e: MouseEvent) => { if (e.target === d) d.close(); };
    d.addEventListener('close', onClose);
    d.addEventListener('click', onClick);
    return () => { d.removeEventListener('close', onClose); d.removeEventListener('click', onClick); };
  }, []);

  const tap = (pos: number) => {
    if (solved) return;
    if (sel === null) return setSel(pos);
    if (sel === pos) return setSel(null);
    setTiles((t) => {
      const c = [...t];
      [c[sel], c[pos]] = [c[pos], c[sel]];
      return c;
    });
    setMoves((m) => m + 1);
    setSel(null);
  };

  return (
      <li className="puzzle-spot">
        <button ref={opener} type="button" className="puzzle-box" onClick={open} aria-haspopup="dialog" aria-label="Abrir o quebra-cabeça do mês">
          <span className="puzzle-lid" style={{ backgroundImage: `url(${IMG})` }}>
            <span className="puzzle-lid-band">The Sunday · quebra-cabeça</span>
          </span>
        </button>
        <span className="puzzle-piece puzzle-piece--1" aria-hidden="true" />
        <span className="puzzle-piece puzzle-piece--2" aria-hidden="true" />
        <span className="puzzle-tag" aria-hidden="true">monte o quebra-cabeça<br />do mês ↓</span>

      <dialog ref={dlg} className="puzzle-dialog" aria-labelledby="puzzle-title">
        <div className="puzzle-card">
          <button type="button" className="puzzle-close" onClick={close} aria-label="Fechar">×</button>
          <p className="eyebrow">Para um domingo sem pressa</p>
          <h2 id="puzzle-title">O quebra-cabeça do mês</h2>
          <p className="puzzle-help">{solved ? 'Pronto! Você montou ♡' : 'Toque em uma peça e depois em outra para trocar as duas de lugar.'}</p>
          <div className={`puzzle-board${solved ? ' is-solved' : ''}${peek ? ' is-peek' : ''}`} style={{ ['--n' as string]: n }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="puzzle-peek" src={IMG} alt="" />
            {tiles.map((t, pos) => (
              <button
                key={t}
                type="button"
                className={`puzzle-tile${sel === pos ? ' is-sel' : ''}${t === pos ? ' is-right' : ''}`}
                style={{ backgroundImage: `url(${IMG})`, backgroundPosition: `${((t % n) / (n - 1)) * 100}% ${(Math.floor(t / n) / (n - 1)) * 100}%` }}
                onClick={() => tap(pos)}
                aria-label={`Peça ${pos + 1}`}
                aria-pressed={sel === pos}
                disabled={solved}
              />
            ))}
          </div>
          <div className="puzzle-actions">
            <span className="puzzle-moves">{moves} {moves === 1 ? 'troca' : 'trocas'}</span>
            <button type="button" onClick={() => setPeek((p) => !p)} aria-pressed={peek}>{peek ? 'Esconder a foto' : 'Espiar a foto'}</button>
            <button type="button" onClick={() => reset(n === 4 ? 3 : 4)}>{n === 4 ? 'Mais fácil (9 peças)' : 'Mais difícil (16 peças)'}</button>
            <button type="button" onClick={() => reset(n)}>Embaralhar</button>
          </div>
        </div>
      </dialog>
      </li>
  );
}
