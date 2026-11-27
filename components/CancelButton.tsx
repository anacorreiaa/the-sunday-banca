'use client';
import { useState } from 'react';

export default function CancelButton({ order }: { order: string }) {
  const [step, setStep] = useState<'idle' | 'ask' | 'busy' | 'done' | 'manual'>('idle');
  const cancel = async () => {
    setStep('busy');
    try {
      const r = await fetch('/api/conta/cancelar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order }) });
      const j = await r.json().catch(() => ({}));
      setStep(j.ok ? 'done' : 'manual');
      if (j.ok) setTimeout(() => window.location.reload(), 1200);
    } catch { setStep('manual'); }
  };
  if (step === 'done') return <p className="ac-note">Assinatura cancelada. Você não será mais cobrada.</p>;
  if (step === 'manual') return <p className="ac-note">Não conseguimos cancelar por aqui. Fale com a gente pelo <a href="https://wa.me/5581992300380" target="_blank" rel="noopener">WhatsApp</a> que resolvemos na hora.</p>;
  if (step === 'ask' || step === 'busy') return (
    <div className="ac-confirm">
      <p>Tem certeza? As próximas cobranças param e você não recebe as próximas edições.</p>
      <div className="ac-row">
        <button type="button" className="ac-ghost" onClick={() => setStep('idle')}>Voltar</button>
        <button type="button" className="ac-danger" onClick={cancel} disabled={step === 'busy'}>{step === 'busy' ? 'Cancelando…' : 'Sim, cancelar'}</button>
      </div>
    </div>
  );
  return <button type="button" className="ac-link" onClick={() => setStep('ask')}>Cancelar assinatura</button>;
}
