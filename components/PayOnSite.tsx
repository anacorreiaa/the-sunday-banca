'use client';
// Mercado Pago's own card / Pix form, shown inside our page (Checkout Bricks).
// The card number never touches our server: Mercado Pago turns it into a one-time token in the browser.
// We also load Mercado Pago's device check (security.js) and send its id with the payment,
// which is what Mercado Pago's fraud check needs to approve more cards.
import { useEffect, useRef, useState } from 'react';

type Plan = { id: string; name: string; amount: number; cycles: number; billing: string };
type Buyer = { nome: string; email: string; whatsapp: string; cep: string; rua: string; numero: string; complemento: string; bairro: string; cidade: string; uf: string };
type Bricks = { create: (kind: string, id: string, settings: Record<string, unknown>) => Promise<{ unmount: () => void }> };
declare global {
  interface Window {
    MercadoPago?: new (key: string, o: Record<string, unknown>) => { bricks: () => Bricks };
    MP_DEVICE_SESSION_ID?: string;
  }
}

const loadScript = (src: string, attrs: Record<string, string> = {}) => new Promise<void>((ok, fail) => {
  if (document.querySelector(`script[src="${src}"]`)) return ok();
  const s = document.createElement('script');
  s.src = src;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  s.onload = () => ok();
  s.onerror = () => fail(new Error(src));
  document.head.appendChild(s);
});

// Plain-language reasons for the refusals people actually hit.
const why = (detail: string) => {
  if (/high_risk|blacklist|other_reason/.test(detail)) return 'O Mercado Pago não aprovou este cartão por segurança. Escolha Pix acima para pagar agora, ou tente outro cartão.';
  if (/insufficient_amount/.test(detail)) return 'O cartão não tem limite para este valor. Tente outro cartão ou menos parcelas.';
  if (/call_for_authorize/.test(detail)) return 'O seu banco pediu para você autorizar a compra. Libere no app do banco e tente de novo.';
  if (/bad_filled/.test(detail)) return 'Algum dado do cartão está errado. Confira número, validade e código de segurança.';
  if (/card_disabled/.test(detail)) return 'Este cartão está bloqueado para compras online. Libere no app do banco ou use outro cartão.';
  return 'O pagamento não foi aprovado. Confira os dados do cartão ou tente outro cartão.';
};

export default function PayOnSite({ inline, publicKey, plan, total, email, order, buyer, onDone, onFallback, onClose }: {
  inline?: boolean; publicKey: string; plan: Plan; total: number; email: string; order: string; buyer: Buyer;
  onDone: () => void; onFallback: () => void; onClose: () => void;
}) {
  const [step, setStep] = useState<'loading' | 'form' | 'pix' | 'error'>('loading');
  const [msg, setMsg] = useState('');
  const [pix, setPix] = useState<{ code: string; image: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [broken, setBroken] = useState(false);
  const brick = useRef<{ unmount: () => void } | null>(null);
  const buyerRef = useRef(buyer);
  buyerRef.current = buyer;

  useEffect(() => {
    let gone = false;
    (async () => {
      try {
        // The device check is best effort: if it fails to load, payment still works.
        loadScript('https://www.mercadopago.com/v2/security.js', { view: 'checkout' }).catch(() => {});
        await loadScript('https://sdk.mercadopago.com/js/v2');
        if (gone || !window.MercadoPago) return;
        const bricks = new window.MercadoPago(publicKey, { locale: 'pt-BR' }).bricks();
        const monthly = plan.billing === 'monthly';
        const [first, ...rest] = buyerRef.current.nome.trim().split(/\s+/);
        brick.current = await bricks.create('payment', 'mp-brick', {
          initialization: { amount: total, payer: { email, firstName: first || '', lastName: rest.join(' ') } },
          customization: {
            paymentMethods: monthly
              ? { creditCard: 'all', bankTransfer: ['pix'], maxInstallments: 1 }
              : { creditCard: 'all', bankTransfer: ['pix'], maxInstallments: 12 },
            visual: { style: { theme: 'default', customVariables: { baseColor: '#8e2b2b', borderRadiusFull: '2px', borderRadiusLarge: '2px', borderRadiusMedium: '2px', borderRadiusSmall: '2px' } } },
          },
          callbacks: {
            onReady: () => { if (!gone) setStep('form'); },
            onError: () => {},
            onSubmit: ({ selectedPaymentMethod, formData }: { selectedPaymentMethod?: string; formData: Record<string, unknown> }) => new Promise<void>(async (resolve, reject) => {
              try {
                setMsg('');
                const r = await fetch('/api/pagamento', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ plan: plan.id, email, order, buyer: buyerRef.current, deviceId: window.MP_DEVICE_SESSION_ID || '', formData: { ...formData, payment_type_id: selectedPaymentMethod || formData.payment_type_id } }),
                });
                const j = await r.json().catch(() => ({}));
                if (!j.ok) { reject(); if (r.status >= 500 || r.status === 400 || r.status === 403) { setBroken(true); setMsg('Não conseguimos abrir o pagamento aqui agora.'); } else setMsg(why(String(j.detail || ''))); setStep('error'); return; }
                resolve();
                if (j.status === 'approved' || j.status === 'authorized' || j.status === 'in_process') { onDone(); return; }
                if (j.status === 'pending' && j.pix?.code) {
                  try { brick.current?.unmount(); } catch {}
                  brick.current = null;
                  setPix({ code: j.pix.code, image: j.pix.image });
                  setStep('pix');
                  return;
                }
                setMsg(why(String(j.detail || '')));
                setStep('error');
              } catch { reject(); setMsg(why('')); setStep('error'); }
            }),
          },
        });
      } catch {
        if (!gone) onFallback();
      }
    })();
    return () => { gone = true; try { brick.current?.unmount(); } catch {} };
  }, [publicKey, plan, total, email, order, onDone, onFallback]);

  const inner = (
    <>
        {step === 'loading' && <p className="ps-pay-wait">Carregando…</p>}
        {step === 'error' && msg && <p className="ps-err" role="alert">{msg}</p>}
        {broken && <button type="button" className="ps-pay" onClick={onFallback}>Pagar pela página do Mercado Pago →</button>}
        {step !== 'pix' && <div id="mp-brick" />}
        {step === 'pix' && pix && (
          <div className="ps-pix">
            <p>Abra o app do seu banco, escolha <b>Pix</b> e leia o QR code, ou use o Pix copia e cola.</p>
            {pix.image && <img src={`data:image/png;base64,${pix.image}`} alt="QR code do Pix" width={220} height={220} />}
            <button type="button" className="ps-pix-copy" onClick={() => { navigator.clipboard?.writeText(pix.code).then(() => setCopied(true)).catch(() => {}); }}>
              {copied ? 'Código copiado ✓' : 'Copiar código Pix'}
            </button>
            <button type="button" className="ps-pay" onClick={onDone}>Já paguei o Pix</button>
          </div>
        )}
    </>
  );
  if (inline) return <div className="co-pay">{inner}</div>;
  return (
    <div className="ps-mp" role="dialog" aria-modal="true" aria-labelledby="mp-pay-h">
      <div className="ps-mp-card ps-pay-card">
        <button type="button" className="ps-pay-x" onClick={onClose} aria-label="Fechar">×</button>
        <h3 id="mp-pay-h">Pagamento</h3>
        <p className="ps-mp-small">Plano {plan.name} · pagamento seguro processado pelo Mercado Pago</p>
        {inner}
      </div>
    </div>
  );
}
