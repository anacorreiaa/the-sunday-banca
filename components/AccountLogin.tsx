'use client';
import { useState } from 'react';

/** E-mail box that sends the sign-in link. */
export default function AccountLogin({ expired }: { expired?: boolean }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error' | 'nomail'>('idle');
  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    try {
      const r = await fetch('/api/conta/entrar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const j = await r.json().catch(() => ({}));
      setState(j.ok ? 'sent' : j.reason === 'mail' ? 'nomail' : 'error');
    } catch { setState('error'); }
  };
  if (state === 'sent') return (
    <div className="ac-card ac-center">
      <div className="ac-check">✓</div>
      <h2>Confira o seu e-mail</h2>
      <p>Se houver uma assinatura com <b>{email}</b>, enviamos um link para você entrar. Ele vale por 1 hora. Olhe também a caixa de spam e a aba Promoções.</p>
    </div>
  );
  return (
    <form className="ac-card" onSubmit={go}>
      <h2>Entrar na minha assinatura</h2>
      <p>Digite o e-mail que você usou ao assinar. Enviamos um link de acesso, sem senha.</p>
      {expired && <p className="ps-err">Esse link expirou. Peça um novo abaixo.</p>}
      <div className="pf-grid ac-grid"><label className="pf-full">E-mail<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" /></label></div>
      <button type="submit" className="ps-pay" disabled={state === 'sending'}>{state === 'sending' ? 'Enviando…' : 'Receber link de acesso'}</button>
      {state === 'error' && <p className="ps-err" role="alert">Não conseguimos enviar agora. Tente de novo em instantes.</p>}
      {state === 'nomail' && <p className="ps-err" role="alert">O acesso por e-mail está sendo ligado. Enquanto isso, fale com a gente pelo WhatsApp.</p>}
    </form>
  );
}
