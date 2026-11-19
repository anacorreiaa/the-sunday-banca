'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Article } from '@/lib/types';
import type { EditionMeta } from '@/lib/editions';
import { cleanSubtitle } from '@/lib/editions';
import Cover from './Cover';

export type Edition = { article: Article; meta: EditionMeta };

type Ctx = {
  editions: Edition[];
  byId: Map<string, Edition>;
  open: (postId: string, opener?: HTMLElement | null) => void;
  label: (tag: string) => string;
};

const EditionsContext = createContext<Ctx | null>(null);

export function useEditions() {
  const c = useContext(EditionsContext);
  if (!c) throw new Error('useEditions outside provider');
  return c;
}

export function EditionsProvider({ editions, tagLabels, children }: { editions: Edition[]; tagLabels: Record<string, string>; children: React.ReactNode }) {
  const [current, setCurrent] = useState<Edition | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const byId = useMemo(() => new Map(editions.map((e) => [e.article.postId, e])), [editions]);
  const label = useCallback((t: string) => tagLabels[t.toLowerCase()] ?? t, [tagLabels]);

  const open = useCallback(
    (postId: string, opener?: HTMLElement | null) => {
      const e = byId.get(postId);
      if (!e) return;
      openerRef.current = opener ?? (document.activeElement as HTMLElement | null);
      setCurrent(e);
    },
    [byId],
  );

  useEffect(() => {
    const d = dialogRef.current;
    if (current && d && !d.open) d.showModal();
  }, [current]);

  const close = () => dialogRef.current?.close();

  const value = useMemo(() => ({ editions, byId, open, label }), [editions, byId, open, label]);
  const sub = current ? cleanSubtitle(current.article.subtitle) : null;

  return (
    <EditionsContext.Provider value={value}>
      {children}
      <dialog
        ref={dialogRef}
        className="preview"
        aria-labelledby="preview-title"
        onClose={() => {
          setCurrent(null);
          openerRef.current?.focus();
        }}
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        {current && (
          <div className="preview-inner">
            <div className="preview-cover">
              <Cover article={current.article} meta={current.meta} eager />
            </div>
            <div className="preview-text">
              <p className="preview-meta">
                {current.meta.number ? `Edição ${current.meta.number}` : current.meta.series}
                {current.article.isPaid && <span className="paid"> · Para assinantes pagas</span>}
              </p>
              <h3 id="preview-title">{current.article.title}</h3>
              <p className="preview-date">
                <time dateTime={current.article.date}>{current.meta.dateLong}</time>
              </p>
              {sub && <p className="preview-sub">{sub}</p>}
              <a className="read" href={current.article.url} target="_blank" rel="noopener">
                Ler no Substack <span aria-hidden="true">↗</span>
              </a>
            </div>
            <button type="button" className="preview-close" onClick={close} aria-label="Fechar">
              <span aria-hidden="true">×</span>
            </button>
          </div>
        )}
      </dialog>
    </EditionsContext.Provider>
  );
}
