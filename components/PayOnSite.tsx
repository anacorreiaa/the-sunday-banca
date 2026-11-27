'use client';
// Mercado Pago's own card / Pix form, shown inside our page (Checkout Bricks).
// If anything here fails, onFallback sends the reader to the plan's Mercado Pago link instead.
import { useEffect, useRef, useState } from 'react';

type Plan = { id: string; name: string; amount: number; cycles: number; billing: string };
type Bricks = { create: (kind: string, id: string, settings: Record<string, unknown>) => Promise<{ unmount: () => void }> };
declare global { interface Window { MercadoPago?: new (key: string, o: Record<string, unknown>) => { bricks: () => Bricks } } }

const SDK = 'https://sdk.mercadopago.com/js/v2';
const loadSdk = () => new Promise<void>((ok, fail) => {
  if (window.MercadoPago) return ok();
  const s = document.createElement('script'); s.src = SDK; s.onload = () => ok(); s.onerror = () => fail(new Error('sdk'));
  document.head.appendChild(s);
});

export default function PayOnSite({ publicKey, plan, total, email, onDone, onFallback, onClose }: {
  publicKey: string; plan: Plan; total: number; email: string;
  onDone: () => void; onFallback: () => void; onClose: () => void;
}) {
  const [step, setStep] = useState<'loading' | 'form' | 'pix' | 'error'>('loading');
  const brick = useRef<{ unmount: () => void } | null>(null);

  useEffect(() => {
    let gone = false;
    (async () => {
      try {
        await loadSdk();
        if (gone || !window.MercadoPago) return;
        const bricks = new window.MercadoPago(publicKey, { locale: 'pt-BR' }).bricks();
        const monthly = plan.billing === 'monthly';
        brick.current = await bricks.create('payment', 'mp-brick', {
          initialization: { amount: total, payer: { email } },
          customization: {
            paymentMethods: monthly ? { creditCard: 'all', maxInstallments: 1 } : { creditCard: 'all', bankTransfer: 'all', maxInstallments: plan.cycles },
            visual: { style: { theme: 'default', customVariables: { baseColor: '#8e2b2b', borderRadiusFull: '2px', borderRadiusLarge: '2px', borderRadiusMedium: '2px', borderRadiusSmall: '2px' } } },
          },
          callbacks: {
            onReady: () => { if (!gone) setStep('form'); },
            onError: () => {},
            onSubmit: ({ formData }: { formData: Record<string, unknown> }) => new Promise<void>(async (resolve, reject) => {
              try {
                const r = await fetch('/api/pagamento', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: plan.id, email, formData }) });
                const j = await r.json();
                if (!j.ok) { reject(); setStep('error'); return; }
                resolve();
                if (j.status === 'approved' || j.status === 'in_process' || j.status === 'authorized') { onDone(); return; }
                if (j.status === 'pending' && formData.payment_method_id === 'pix') {
                  brick.current?.unmount();
                  setStep('pix');
                  brick.current = await bricks.create('statusScreen', 'mp-brick', { initialization: { paymentId: String(j.id) }, callbacks: { onReady: () => {}, onError: () => {} } });
                  return;
                }
                setStep('error');
              } catch { reject(); setStep('error'); }
            }),
          },
        });
      } catch {
        if (!gone) onFallback();
      }
    })();
    return () => { gone = true; try { brick.current?.unmount(); } catch {} };
  }, [publicKey, plan, total, email, onDone, onFallback]);

  return (
    <div className="ps-mp" role="dialog" aria-modal="true" aria-labelledby="mp-pay-h">
      <div className="ps-mp-card ps-pay-card">
        <button type="button" className="ps-pay-x" onClick={onClose} aria-label="Fechar">×</button>
        <h3 id="mp-pay-h">Pagamento</h3>
        <p className="ps-mp-small">Plano {plan.name} · pagamento seguro pelo Mercado Pago</p>
        {step === 'loading' && <p className="ps-pay-wait">Carregando…</p>}
        {step === 'error' && <p className="ps-err" role="alert">O pagamento não foi aprovado. Confira os dados do cartão ou tente outro meio de pagamento.</p>}
        <div id="mp-brick" />
        {step === 'pix' && <button type="button" className="ps-pay" onClick={onDone}>Já paguei o Pix</button>}
      </div>
    </div>
  );
}
