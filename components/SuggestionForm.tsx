'use client';

import { useRef, useState } from 'react';

type Copy = {
  heading: string;
  label: string;
  placeholder: string;
  button: string;
  sending: string;
  success: string;
  error: string;
  closed: string;
};

type State = 'idle' | 'sending' | 'success' | 'error';
const MAX = 2000;

function newId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // RFC 4122 v4 fallback
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export default function SuggestionForm({ copy, enabled }: { copy: Copy; enabled: boolean }) {
  const [message, setMessage] = useState('');
  const [state, setState] = useState<State>('idle');
  const [errorText, setErrorText] = useState(copy.error);
  const idRef = useRef<string | null>(null); // same id across retries of one message
  const hpRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enabled || state === 'sending') return;
    const text = message.trim();
    if (!text) {
      setErrorText('Escreva sua sugestão antes de enviar.');
      setState('error');
      return;
    }
    idRef.current ||= newId();
    setState('sending');
    try {
      const res = await fetch('api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idRef.current, message: text, website: hpRef.current?.value || '' }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setMessage('');
        idRef.current = null;
        setState('success');
        return;
      }
      setErrorText(
        data.error === 'rate_limited'
          ? 'Recebemos várias sugestões daqui na última hora. Tente de novo mais tarde.'
          : data.error === 'too_long'
            ? `A sugestão pode ter até ${MAX} caracteres.`
            : copy.error,
      );
      setState('error');
    } catch {
      setErrorText(copy.error);
      setState('error');
    }
  }

  return (
    <form className="suggest" onSubmit={onSubmit} noValidate aria-describedby="suggest-status">
      <h2 className="suggest-heading" id="suggest-heading">{copy.heading}</h2>
      <label htmlFor="suggest-input" className="sr-only">{copy.label}</label>
      <div className="suggest-row">
        <textarea
          id="suggest-input"
          name="message"
          rows={3}
          maxLength={MAX}
          placeholder={copy.placeholder}
          value={message}
          disabled={!enabled}
          onChange={(e) => {
            setMessage(e.target.value);
            if (state !== 'sending') setState('idle');
          }}
        />
        <button type="submit" className="suggest-send" disabled={!enabled || state === 'sending'}>
          {state === 'sending' ? copy.sending : copy.button}
        </button>
      </div>
      <div className="hp" aria-hidden="true">
        <label>
          Website
          <input ref={hpRef} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p id="suggest-status" className={`suggest-status suggest-status--${enabled ? state : 'closed'}`} role="status" aria-live="polite">
        {!enabled ? copy.closed : state === 'success' ? copy.success : state === 'error' ? errorText : ''}
      </p>
    </form>
  );
}
