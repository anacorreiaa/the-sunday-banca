'use client';

import { useRef, useState } from 'react';
import { useEditions } from './Editions';
import muralPhotos from '@/lib/mural.json';

type Copy = { heading: string; prompts: string[]; button: string; sending: string; success: string; error: string };
type State = 'idle' | 'sending' | 'success' | 'error';
const MAX = 2000;

function newId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Position on the desktop board: % of the cork area, width %, rotation, stacking. */
type Spot = { x: number; y: number; w: number; r: number; z?: number };
const pos = (s: Spot): React.CSSProperties => ({
  ['--x' as string]: `${s.x}%`, ['--y' as string]: `${s.y}%`, ['--w' as string]: `${s.w}%`, ['--r' as string]: `${s.r}deg`, ['--z' as string]: s.z ?? 1,
});

/** Lets the visitor pick up any item on the desktop board and move it around (positions stay in %). */
function useDraggable() {
  const top = useRef(20);
  return (e: React.PointerEvent<HTMLUListElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('textarea, input, button, a, select, label')) return;
    const li = target.closest('li.bi') as HTMLElement | null;
    const ul = e.currentTarget;
    if (!li || getComputedStyle(li).position !== 'absolute') return;
    e.preventDefault();
    const box = ul.getBoundingClientRect();
    const x0 = parseFloat(li.style.getPropertyValue('--x')) || 0;
    const y0 = parseFloat(li.style.getPropertyValue('--y')) || 0;
    const sx = e.clientX, sy = e.clientY;
    li.style.setProperty('--z', String(++top.current));
    li.classList.add('is-dragging');
    li.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const x = Math.min(97, Math.max(-5, x0 + ((ev.clientX - sx) / box.width) * 100));
      const y = Math.min(97, Math.max(-3, y0 + ((ev.clientY - sy) / box.height) * 100));
      li.style.setProperty('--x', `${x}%`);
      li.style.setProperty('--y', `${y}%`);
    };
    const up = () => {
      li.classList.remove('is-dragging');
      li.removeEventListener('pointermove', move);
      li.removeEventListener('pointerup', up);
      li.removeEventListener('pointercancel', up);
    };
    li.addEventListener('pointermove', move);
    li.addEventListener('pointerup', up);
    li.addEventListener('pointercancel', up);
  };
}

const PIN_COLORS = ['#8E2B2B', '#4E5D68', '#CFAD64', '#6E6B3F', '#FAF8F3', '#7D8E95'];

// The six newest editions become pinned photo prints.
const PHOTO_SPOTS: Spot[] = [
  { x: 2.5, y: 4, w: 14, r: -4 },
  { x: 74, y: 3, w: 13.5, r: 3 },
  { x: 2, y: 58, w: 13.5, r: 3, z: 2 },
  { x: 31, y: 44, w: 13, r: -2 },
  { x: 72.5, y: 60, w: 13.5, r: -3 },
  { x: 47.5, y: 61, w: 13, r: 4 },
];
const NOTE_SPOTS: Spot[] = [
  { x: 4, y: 33, w: 16.5, r: -2.5, z: 3 },
  { x: 57, y: 37, w: 16.5, r: 2, z: 3 },
  { x: 80, y: 33, w: 16.5, r: -1.5, z: 3 },
];
const NOTE_COLORS = ['#F3E3A1', '#EBD5C8', '#DCE3C6'];

const STICKERS: { src: string; s: Spot }[] = [
  { src: 'cup-blue', s: { x: 17.5, y: 6, w: 10, r: 0, z: 2 } },
  { src: 'toaster', s: { x: 88, y: 12, w: 8, r: 4, z: 2 } },
  { src: 'berries', s: { x: 16.5, y: 83, w: 8, r: 0, z: 4 } },
  { src: 'cards', s: { x: 61.5, y: 69, w: 9, r: -6, z: 4 } },
  { src: 'vase', s: { x: 44.5, y: 37, w: 9, r: 0, z: 4 } },
  { src: 'boat', s: { x: 88, y: 72, w: 9, r: 3, z: 4 } },
  { src: 'pajama', s: { x: 21, y: 44, w: 6.5, r: 6, z: 2 } },
  { src: 'magazines', s: { x: 32, y: 70, w: 11, r: -5, z: 2 } },
];

function WriteNote({ prompt, index, enabled, copy, spot }: { prompt: string; index: number; enabled: boolean; copy: Copy; spot: Spot }) {
  const [message, setMessage] = useState('');
  const [state, setState] = useState<State>('idle');
  const [note, setNote] = useState('');
  const idRef = useRef<string | null>(null);
  const hpRef = useRef<HTMLInputElement>(null);
  const fieldId = `note-${index}`;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (state === 'sending') return;
    const text = message.trim();
    if (!text) { setNote('Escreva sua ideia no post-it.'); setState('error'); return; }
    if (!enabled) { setNote('As sugestões abrem em breve. Guarde essa ideia para nós!'); setState('error'); return; }
    idRef.current ||= newId();
    setState('sending');
    try {
      const res = await fetch('api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idRef.current, message: `${prompt.replace(/…$/, '')}: ${text}`, website: hpRef.current?.value || '' }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) { setMessage(''); idRef.current = null; setNote(copy.success); setState('success'); return; }
      setNote(data.error === 'rate_limited' ? 'Recebemos várias sugestões daqui na última hora. Tente mais tarde.' : data.error === 'too_long' ? `Até ${MAX} caracteres.` : copy.error);
      setState('error');
    } catch {
      setNote(copy.error);
      setState('error');
    }
  }

  return (
    <li className="bi postit postit--write" style={{ ...pos(spot), ['--note' as string]: NOTE_COLORS[index % NOTE_COLORS.length] }}>
      <span className="pushpin" style={{ ['--pin' as string]: PIN_COLORS[index] }} aria-hidden="true" />
      <form onSubmit={send} noValidate>
        <label htmlFor={fieldId} className="postit-prompt">{prompt}</label>
        <textarea
          id={fieldId}
          rows={4}
          maxLength={MAX}
          value={message}
          onChange={(e) => { setMessage(e.target.value); if (state !== 'sending') setState('idle'); }}
          placeholder="escreva aqui…"
        />
        <div className="hp" aria-hidden="true"><input ref={hpRef} type="text" tabIndex={-1} autoComplete="off" /></div>
        <div className="postit-foot">
          <p className={`postit-status postit-status--${state}`} role="status" aria-live="polite">{state === 'success' || state === 'error' ? note : ''}</p>
          <button type="submit" disabled={state === 'sending'}>{state === 'sending' ? copy.sending : copy.button}</button>
        </div>
      </form>
    </li>
  );
}

// Version B: the owners' own mood photos taped and pinned around the post-its.
type Mood = { src: string; s: Spot; kind: 'polaroid' | 'tape' | 'plain' };
const MOOD: Mood[] = [
  { src: 'limoes', kind: 'tape', s: { x: 1.5, y: 2, w: 12, r: -3 } },
  { src: 'revistas', kind: 'polaroid', s: { x: 14.5, y: 1, w: 11, r: 4 } },
  { src: 'veleiro', kind: 'plain', s: { x: 71.5, y: 1.5, w: 10.5, r: 3 } },
  { src: 'roupao', kind: 'polaroid', s: { x: 83, y: 2, w: 13, r: -4 } },
  { src: 'leitura', kind: 'tape', s: { x: 22, y: 33, w: 10, r: 5, z: 2 } },
  { src: 'quarto', kind: 'plain', s: { x: 46, y: 33, w: 10, r: -3, z: 2 } },
  { src: 'baguete', kind: 'polaroid', s: { x: 74, y: 31, w: 10, r: 3, z: 2 } },
  { src: 'cafe', kind: 'tape', s: { x: 15.5, y: 60, w: 10.5, r: -4, z: 2 } },
  { src: 'bobes', kind: 'polaroid', s: { x: 63.5, y: 61, w: 10, r: 5, z: 2 } },
  { src: 'books', kind: 'plain', s: { x: 86.5, y: 33, w: 10, r: 4, z: 2 } },
  { src: 'lago', kind: 'tape', s: { x: 86, y: 63, w: 11, r: -3, z: 2 } },
  { src: 'sudoku', kind: 'plain', s: { x: 33, y: 66, w: 9.5, r: -5, z: 2 } },
  { src: 'album', kind: 'polaroid', s: { x: 74.5, y: 66, w: 10, r: -2, z: 3 } },
  { src: 'papeis', kind: 'plain', s: { x: 42, y: 73, w: 7, r: 3, z: 2 } },
];
const PRINT_SPOTS_B: Spot[] = [
  { x: 26.5, y: 4, w: 10, r: -3, z: 2 },
  { x: 60, y: 4, w: 10, r: 4, z: 2 },
  { x: 2, y: 64, w: 11, r: 3, z: 2 },
  { x: 33.5, y: 36, w: 10.5, r: -2, z: 3 },
  { x: 59, y: 33, w: 10, r: 3, z: 3 },
  { x: 22, y: 70, w: 10.5, r: -4, z: 3 },
];
const NOTE_SPOTS_B: Spot[] = [
  { x: 3, y: 31, w: 15.5, r: -2.5, z: 4 },
  { x: 49, y: 63, w: 15.5, r: 2, z: 4 },
  { x: 69.5, y: 30, w: 15.5, r: -1.5, z: 4 },
];
const STICKERS_B: { src: string; s: Spot }[] = [
  { src: 'cup-blue', s: { x: 38, y: 24, w: 7, r: 0, z: 5 } },
  { src: 'berries', s: { x: 13, y: 88, w: 6.5, r: 0, z: 5 } },
  { src: 'vase', s: { x: 55.5, y: 23, w: 6, r: 0, z: 5 } },
  { src: 'boat', s: { x: 80, y: 85, w: 6.5, r: 3, z: 5 } },
  { src: 'pajama', s: { x: 0.5, y: 52, w: 5, r: -6, z: 5 } },
];

// Version C: only the owners' photos (big and small), post-its and loose drawn pins. No edition prints.
const MOOD_C: Mood[] = [
  { src: 'limoes', kind: 'tape', s: { x: 1.5, y: 3, w: 16, r: -3 } },
  { src: 'revistas', kind: 'polaroid', s: { x: 19, y: 2, w: 10, r: 4 } },
  { src: 'veleiro', kind: 'plain', s: { x: 63, y: 2, w: 13, r: 3 } },
  { src: 'roupao', kind: 'polaroid', s: { x: 78, y: 3, w: 12, r: -4 } },
  { src: 'bobes', kind: 'polaroid', s: { x: 19.5, y: 33, w: 10, r: -3, z: 2 } },
  { src: 'leitura', kind: 'tape', s: { x: 31, y: 32, w: 14.5, r: 3, z: 2 } },
  { src: 'cafe', kind: 'tape', s: { x: 47, y: 34, w: 9, r: -4, z: 2 } },
  { src: 'baguete', kind: 'polaroid', s: { x: 57.5, y: 31, w: 10, r: 4, z: 2 } },
  { src: 'quarto', kind: 'plain', s: { x: 86, y: 30, w: 11, r: 3, z: 2 } },
  { src: 'lago', kind: 'tape', s: { x: 1, y: 62, w: 15, r: 2, z: 2 } },
  { src: 'sudoku', kind: 'plain', s: { x: 18, y: 66, w: 10, r: -4, z: 2 } },
  { src: 'album', kind: 'polaroid', s: { x: 29.5, y: 61, w: 14, r: 2, z: 2 } },
  { src: 'books', kind: 'plain', s: { x: 63, y: 64, w: 8, r: 5, z: 2 } },
  { src: 'safari', kind: 'tape', s: { x: 72.5, y: 60, w: 11, r: -2, z: 2 } },
  { src: 'presentes', kind: 'polaroid', s: { x: 89, y: 9, w: 9, r: 6, z: 1 } },
];
const NOTE_SPOTS_C: Spot[] = [
  { x: 3, y: 33, w: 15, r: -2.5, z: 4 },
  { x: 69, y: 31, w: 15, r: -1.5, z: 4 },
  { x: 46, y: 63, w: 15, r: 2, z: 4 },
];
const STICKERS_C: { src: string; s: Spot }[] = [
  { src: 'cup-blue', s: { x: 30, y: 17, w: 7, r: 0, z: 5 } },
  { src: 'toaster', s: { x: 62, y: 54, w: 5, r: 4, z: 5 } },
  { src: 'vase', s: { x: 47.5, y: 52, w: 6, r: 0, z: 5 } },
  { src: 'pajama', s: { x: 59.5, y: 20, w: 4.2, r: -6, z: 7 } },
  { src: 'berries', s: { x: 41, y: 87, w: 6, r: 0, z: 5 } },
  { src: 'cards', s: { x: 62, y: 86, w: 7, r: -6, z: 5 } },
  { src: 'boat', s: { x: 82.5, y: 50, w: 5.5, r: 3, z: 5 } },
  { src: 'puzzles', s: { x: 6, y: 88, w: 7, r: -5, z: 5 } },
];

export default function SuggestionBoard({ copy, enabled, variant = 'a' }: { copy: Copy; enabled: boolean; variant?: 'a' | 'b' | 'c' }) {
  if (variant === 'b') return <BoardB copy={copy} enabled={enabled} />;
  if (variant === 'c') return <BoardC copy={copy} enabled={enabled} />;
  return <BoardA copy={copy} enabled={enabled} />;
}

function BoardB({ copy, enabled }: { copy: Copy; enabled: boolean }) {
  const { editions, open } = useEditions();
  const prints = editions.filter((e) => e.meta.photo).slice(0, PRINT_SPOTS_B.length);
  return (
    <section className="board board--b" id="sugestoes" aria-labelledby="board-heading">
      <div className="board-cork">
        <ul className="collage">
          <li className="bi board-title" style={pos({ x: 37, y: 3, w: 23.5, r: -1, z: 6 })}>
            <span className="tape tape--l" aria-hidden="true" />
            <span className="tape tape--r" aria-hidden="true" />
            <h2 id="board-heading">{copy.heading}</h2>
            <p>Escreva num post-it.</p>
          </li>
          {copy.prompts.map((p, i) => (
            <WriteNote key={p} prompt={p} index={i} enabled={enabled} copy={copy} spot={NOTE_SPOTS_B[i % NOTE_SPOTS_B.length]} />
          ))}
          {prints.map((e, i) => (
            <li key={e.article.postId} className="bi print" style={pos(PRINT_SPOTS_B[i])}>
              <span className="pushpin" style={{ ['--pin' as string]: PIN_COLORS[(i + 2) % PIN_COLORS.length] }} aria-hidden="true" />
              <button type="button" onClick={(ev) => open(e.article.postId, ev.currentTarget)} aria-haspopup="dialog" aria-label={`${e.article.title}, ${e.meta.dateLong}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.meta.photo!} alt="" loading="lazy" />
                <span className="print-caption">{e.article.title}</span>
              </button>
            </li>
          ))}
          {MOOD.map((m, i) => (
            <li key={m.src} className={`bi mood mood--${m.kind}`} style={pos(m.s)} aria-hidden="true">
              {m.kind === 'tape' && <span className="tape tape--c" />}
              {m.kind !== 'tape' && <span className="pushpin" style={{ ['--pin' as string]: PIN_COLORS[(i + 4) % PIN_COLORS.length] }} />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`assets/mood/${m.src}.webp`} alt="" loading="lazy" />
            </li>
          ))}
          <li className="bi swatch swatch--gingham" style={pos({ x: 13.5, y: 34, w: 6, r: -6, z: 1 })} aria-hidden="true" />
          <li className="bi handnote" style={pos({ x: 33, y: 89, w: 11, r: 2, z: 5 })} aria-hidden="true">sente-se, a mesa está posta ♡</li>
          <li className="bi badge" style={pos({ x: 90, y: 87, w: 8, r: -8, z: 5 })} aria-hidden="true"><span>The Sunday</span><b>Talks</b><span>em breve</span></li>
          {STICKERS_B.map((st) => (
            <li key={st.src} className="bi sticker-loose" style={pos(st.s)} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`assets/drawn/${st.src}.webp`} alt="" loading="lazy" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BoardC({ copy, enabled }: { copy: Copy; enabled: boolean }) {
  const drag = useDraggable();
  return (
    <section className="board board--b board--drag" id="sugestoes" aria-labelledby="board-heading">
      <div className="board-cork">
        <ul className="collage" onPointerDown={drag}>
          <li className="bi board-title" style={pos({ x: 33, y: 3, w: 26, r: -1, z: 6 })}>
            <span className="tape tape--l" aria-hidden="true" />
            <span className="tape tape--r" aria-hidden="true" />
            <h2 id="board-heading">{copy.heading}</h2>
            <p>Escreva num post-it.</p>
          </li>
          {copy.prompts.map((p, i) => (
            <WriteNote key={p} prompt={p} index={i} enabled={enabled} copy={copy} spot={NOTE_SPOTS_C[i % NOTE_SPOTS_C.length]} />
          ))}
          {MOOD_C.slice(0, muralPhotos.length || MOOD_C.length).map((m, i) => (
            <li key={m.src} className={`bi mood mood--${m.kind}`} style={pos(m.s)} aria-hidden="true">
              {m.kind === 'tape' && <span className="tape tape--c" />}
              {m.kind !== 'tape' && <span className="pushpin" style={{ ['--pin' as string]: PIN_COLORS[(i + 4) % PIN_COLORS.length] }} />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={muralPhotos[i] || `assets/mood/${m.src}.webp`} alt="" loading="lazy" />
            </li>
          ))}
          <li className="bi tickets" style={pos({ x: 28.5, y: 86, w: 13.5, r: -4, z: 5 })} aria-hidden="true">
            <span className="ticket2 ticket2--back" />
            <span className="ticket2"><span className="ticket2-top">· TICKET ·</span><b>Sunday Lunch</b><span className="ticket2-sub">ADMIT ONE</span></span>
          </li>
          <li className="bi letters" style={pos({ x: 84.5, y: 59, w: 13, r: 4, z: 3 })} aria-hidden="true">
            <span className="letter letter--back" />
            <span className="letter">Querida,<br />domingo que vem tem bolo de limão e conversa longa. Traz aquele livro que você me prometeu.<br /><span className="letter-sign">com carinho, M.</span></span>
          </li>
          <li className="bi recipe" style={pos({ x: 14.5, y: 83.5, w: 12.5, r: 3, z: 5 })} aria-hidden="true">
            <span className="recipe-title">Bolo de limão da vó</span>
            3 ovos, 1 xíc. de açúcar, 2 limões, 2 xíc. de farinha. Forno médio, 40 min ♡
          </li>
          <li className="bi badge" style={pos({ x: 90, y: 86, w: 8, r: -8, z: 5 })} aria-hidden="true"><span>The Sunday</span><b>Talks</b><span>em breve</span></li>
          {STICKERS_C.map((st) => (
            <li key={st.src} className="bi sticker-loose" style={pos(st.s)} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`assets/drawn/${st.src}.webp`} alt="" loading="lazy" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BoardA({ copy, enabled }: { copy: Copy; enabled: boolean }) {
  const { editions, open } = useEditions();
  const prints = editions.filter((e) => e.meta.photo).slice(0, PHOTO_SPOTS.length);

  return (
    <section className="board" id="sugestoes" aria-labelledby="board-heading">
      <div className="board-cork">
        <ul className="collage">
          {/* Title card */}
          <li className="bi board-title" style={pos({ x: 31, y: 5, w: 38, r: -1, z: 3 })}>
            <span className="tape tape--l" aria-hidden="true" />
            <span className="tape tape--r" aria-hidden="true" />
            <h2 id="board-heading">{copy.heading}</h2>
            <p>Escreva num post-it.</p>
          </li>

          {/* Writable post-its */}
          {copy.prompts.map((p, i) => (
            <WriteNote key={p} prompt={p} index={i} enabled={enabled} copy={copy} spot={NOTE_SPOTS[i % NOTE_SPOTS.length]} />
          ))}

          {/* Editions as pinned photo prints */}
          {prints.map((e, i) => (
            <li key={e.article.postId} className="bi print" style={pos(PHOTO_SPOTS[i])}>
              <span className="pushpin" style={{ ['--pin' as string]: PIN_COLORS[(i + 2) % PIN_COLORS.length] }} aria-hidden="true" />
              <button type="button" onClick={(ev) => open(e.article.postId, ev.currentTarget)} aria-haspopup="dialog" aria-label={`${e.article.title}, ${e.meta.dateLong}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.meta.photo!} alt="" loading="lazy" />
                <span className="print-caption">{e.article.title}</span>
              </button>
            </li>
          ))}

          {/* Paper scraps, swatches and labels */}
          <li className="bi swatch swatch--stripes" style={pos({ x: 17, y: 30, w: 8, r: 5 })} aria-hidden="true" />
          <li className="bi swatch swatch--gingham" style={pos({ x: 66, y: 4, w: 7.5, r: -6 })} aria-hidden="true" />
          <li className="bi swatch swatch--diamond" style={pos({ x: 87, y: 50, w: 7, r: 4 })} aria-hidden="true" />
          <li className="bi swatch swatch--hanky" style={pos({ x: 16.5, y: 59, w: 10, r: -3 })} aria-hidden="true" />
          <li className="bi label label--cereja" style={pos({ x: 28, y: 33, w: 9, r: -5, z: 2 })} aria-hidden="true">Why Sunday?</li>
          <li className="bi badge" style={pos({ x: 88.5, y: 88, w: 9, r: -8, z: 4 })} aria-hidden="true"><span>The Sunday</span><b>Talks</b><span>em breve</span></li>
          <li className="bi handnote" style={pos({ x: 75, y: 89, w: 12, r: 2, z: 3 })} aria-hidden="true">sente-se,<br />a mesa está posta ♡</li>
          <li className="bi handnote handnote--green" style={pos({ x: 25, y: 88, w: 12, r: -2, z: 3 })} aria-hidden="true">curiosidade<br />é o nosso domingo</li>
          <li className="bi ticket" style={pos({ x: 59, y: 89, w: 12, r: -2, z: 3 })} aria-hidden="true"><span>ADMIT ONE</span><b>Sunday Lunch</b></li>

          {/* Loose drawn stickers */}
          {STICKERS.map((st) => (
            <li key={st.src} className="bi sticker-loose" style={pos(st.s)} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`assets/drawn/${st.src}.webp`} alt="" loading="lazy" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
