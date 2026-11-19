'use client';

import { useRef, useState } from 'react';
import { useEditions } from './Editions';

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

// Post-it colours from the palette, and the little drawn objects used as magnets.
const NOTE_COLORS = ['#F3E3A1', '#EBD5C8', '#DCE3C6', '#E9DFD0', '#F2D7A6', '#D9E1E4'];
const MAGNETS = ['cup-blue', 'toaster', 'berries', 'cards', 'vase', 'boat', 'pajama', 'puzzles'];
const tilt = (i: number) => [-3, 2.2, -1.4, 3.1, -2.4, 1.2, -0.8, 2.6][i % 8];

function WriteNote({ prompt, index, enabled, copy }: { prompt: string; index: number; enabled: boolean; copy: Copy }) {
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
    <li className="postit postit--write" style={{ ['--note' as string]: NOTE_COLORS[index % NOTE_COLORS.length], ['--tilt' as string]: `${tilt(index)}deg` }}>
      <span className="pin" aria-hidden="true" />
      <form onSubmit={send} noValidate>
        <label htmlFor={fieldId} className="postit-prompt">{prompt}</label>
        <textarea
          id={fieldId}
          rows={4}
          maxLength={MAX}
          value={message}
          onChange={(e) => { setMessage(e.target.value); if (state !== 'sending') setState('idle'); }}
          placeholder="escreva aqui"
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

export default function SuggestionBoard({ copy, enabled }: { copy: Copy; enabled: boolean }) {
  const { editions, open } = useEditions();
  const done = editions.slice(0, 8);

  // Interleave: writable notes first among the topics already covered.
  const items: ({ kind: 'write'; i: number } | { kind: 'done'; i: number })[] = [];
  const order = [0, 'd', 1, 'd', 'd', 2, 'd', 'd', 'd', 'd', 'd'] as const;
  let d = 0;
  for (const o of order) {
    if (o === 'd') { if (d < done.length) items.push({ kind: 'done', i: d++ }); }
    else if (o < copy.prompts.length) items.push({ kind: 'write', i: o });
  }
  while (d < done.length) items.push({ kind: 'done', i: d++ });

  return (
    <section className="board" id="sugestoes" aria-labelledby="board-heading">
      <div className="board-frame">
        <div className="board-cork">
          <div className="board-title">
            <span className="pin pin--red" aria-hidden="true" />
            <h2 id="board-heading">{copy.heading}</h2>
            <p>Escreva num post-it em branco. Nos outros, o que já viramos edição.</p>
          </div>
          <ul className="board-notes">
            {items.map((it, k) => {
              if (it.kind === 'write') return <WriteNote key={`w${it.i}`} prompt={copy.prompts[it.i]} index={it.i} enabled={enabled} copy={copy} />;
              const e = done[it.i];
              const magnet = MAGNETS[it.i % MAGNETS.length];
              return (
                <li
                  key={e.article.postId}
                  className="postit postit--done"
                  style={{ ['--note' as string]: NOTE_COLORS[(it.i + 3) % NOTE_COLORS.length], ['--tilt' as string]: `${tilt(k + 3)}deg` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="magnet" src={`assets/drawn/${magnet}.webp`} alt="" aria-hidden="true" />
                  <button type="button" onClick={(ev) => open(e.article.postId, ev.currentTarget)} aria-haspopup="dialog">
                    <span className="postit-label">{e.meta.label} · já escrevemos</span>
                    <span className="postit-title">{e.article.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
