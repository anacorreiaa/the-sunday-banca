'use client';

// Palavritas: guess the five-letter word of the day in six tries. Accents don't matter.
import Celebrate from './Celebrate';
import { useCallback, useEffect, useState } from 'react';

const WORDS = [
  'LIVRO', 'VINHO', 'PRATO', 'TORTA', 'PRAIA', 'CARTA', 'VELAS', 'LIMAO', 'MANTA', 'POEMA',
  'FESTA', 'PIANO', 'MUSEU', 'PAPEL', 'FOLHA', 'JARRA', 'MOLHO', 'CANJA', 'PUDIM', 'ARTES',
  'BOLSA', 'LENCO', 'VERSO', 'TEMPO', 'SONHO', 'AMIGA', 'RISOS', 'CALMA', 'DOCES', 'ROSAS',
  'TACAS', 'CHAVE', 'NUVEM', 'MAPAS', 'VIOLA', 'RENDA', 'SALAO', 'PEIXE', 'MASSA', 'SABOR',
  'CREME', 'BRISA', 'HORTA', 'JOIAS', 'LACOS', 'PRATA', 'CIDRA', 'MACAS', 'OLIVA', 'MENTA',
];
const ROWS = 6;
const KEYS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
type Mark = 'ok' | 'near' | 'no';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
function today() {
  const d = new Date();
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}
function score(guess: string, answer: string): Mark[] {
  const res: Mark[] = Array(5).fill('no');
  const left: Record<string, number> = {};
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) res[i] = 'ok';
    else left[answer[i]] = (left[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < 5; i++) {
    if (res[i] === 'ok') continue;
    if (left[guess[i]]) { res[i] = 'near'; left[guess[i]]--; }
  }
  return res;
}

export default function Palavritas() {
  const day = today();
  const answer = norm(WORDS[day % WORDS.length]);
  const [rows, setRows] = useState<string[]>([]);
  const [cur, setCur] = useState('');
  const [msg, setMsg] = useState('');
  const done = rows.includes(answer) || rows.length >= ROWS;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('palavritas') || 'null');
      if (saved?.day === day) setRows(saved.rows);
    } catch {}
  }, [day]);
  useEffect(() => {
    try { localStorage.setItem('palavritas', JSON.stringify({ day, rows })); } catch {}
  }, [day, rows]);

  const press = useCallback((k: string) => {
    if (done) return;
    setMsg('');
    if (k === 'ENTER') {
      if (cur.length < 5) return setMsg('A palavra tem 5 letras.');
      const next = [...rows, cur];
      setRows(next);
      setCur('');
      if (cur === answer) setMsg('Isso! Volte amanhã para uma palavra nova.');
      else if (next.length >= ROWS) setMsg(`A palavra era ${WORDS[day % WORDS.length]}.`);
      return;
    }
    if (k === 'BACK') return setCur((c) => c.slice(0, -1));
    if (/^[A-Z]$/.test(k)) setCur((c) => (c.length < 5 ? c + k : c));
  }, [answer, cur, day, done, rows]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select')) return;
      if (e.key === 'Enter') press('ENTER');
      else if (e.key === 'Backspace') press('BACK');
      else { const k = norm(e.key); if (/^[A-Z]$/.test(k)) press(k); }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [press]);

  const keyMark: Record<string, Mark> = {};
  for (const g of rows) score(g, answer).forEach((m, i) => {
    const l = g[i];
    if (keyMark[l] === 'ok' || (keyMark[l] === 'near' && m === 'no')) return;
    keyMark[l] = m;
  });

  return (
    <div className="palavritas">
      <p className="game-note">Descubra a palavra de hoje em 6 tentativas. Verde: letra certa no lugar certo. Mostarda: a letra existe, mas em outro lugar. Os acentos não contam.</p>
      <div className="pw-grid" role="grid" aria-label="Tentativas">
        {Array.from({ length: ROWS }, (_, r) => {
          const word = r < rows.length ? rows[r] : r === rows.length ? cur : '';
          const marks = r < rows.length ? score(rows[r], answer) : null;
          return (
            <div key={r} className="pw-row" role="row">
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} role="gridcell" className={`pw-cell${marks ? ` is-${marks[i]}` : word[i] ? ' is-typed' : ''}`} style={{ animationDelay: `${i * 0.08}s` }}>{word[i] || ''}</span>
              ))}
            </div>
          );
        })}
      </div>
      <Celebrate on={msg.startsWith('Isso!')} text="Você descobriu a palavra de hoje!!!" />
      <p className="pw-msg" aria-live="polite">{msg}</p>
      <div className="pw-keys">
        {KEYS.map((row, i) => (
          <div key={row} className="pw-krow">
            {i === 2 && <button type="button" className="pw-key pw-key--wide" onClick={() => press('ENTER')}>Enviar</button>}
            {[...row].map((k) => (
              <button key={k} type="button" className={`pw-key${keyMark[k] ? ` is-${keyMark[k]}` : ''}`} onClick={() => press(k)}>{k}</button>
            ))}
            {i === 2 && <button type="button" className="pw-key pw-key--wide" onClick={() => press('BACK')} aria-label="Apagar">⌫</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
