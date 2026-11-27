'use client';

// Plans for the printed magazine. "Assinar" opens the checkout page for that plan.
import { useEffect } from 'react';

type Plan = { id: string; name: string; price: string; per: string; desc: string; checkoutUrl: string; featured?: boolean; amount: number; cycles: number; billing: string; freeShipping?: boolean; perk?: string; total?: string; payNote?: string; renews?: boolean; was?: string; promo?: string; gifts?: string[] };

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** What the customer pays for a plan. Long plans ship free; the monthly plan pays a fixed delivery fee. */
export function totalFor(p: Plan, fixedFrete: number) {
  const frete = p.freeShipping ? 0 : fixedFrete;
  if (p.billing === 'monthly') return { frete, line: `${brl(p.amount)} + ${brl(frete)} de frete`, total: `${brl(p.amount + frete)} por mês` };
  return { frete, line: `${p.cycles} × ${brl(p.amount)}, frete grátis`, total: brl(p.amount * p.cycles) };
}


export default function PrintSubscribe({ plans, children }: { plans: Plan[]; fixedFrete?: number; children?: React.ReactNode }) {
  const go = (id: string) => { window.location.href = `/checkout?plano=${id}`; };
  // Old links with ?plano=… now go straight to the checkout.
  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get('plano');
    if (want && plans.some((p) => p.id === want)) window.location.replace(`/checkout?plano=${want}`);
  }, [plans]);
  const planId: string | null = null;
  const pick = go;

  return (
    <>
    <div className="ps-table">
      <section className="ps-plans" id="planos" aria-labelledby="planos-h">
        <h1 id="planos-h" className="rv-h2">Escolha o seu plano</h1>
        {plans.some((p) => p.promo) && (
        <div className="bf-banner" role="note">
          <span className="bf-banner-k">Black Friday · até 30/11</span>
        </div>
      )}
        <div className="store-row rv-row">
          {[...plans].sort((x, y) => (y.promo ? 1 : 0) - (x.promo ? 1 : 0) || (y.cycles || 0) - (x.cycles || 0)).map((p) => {
            const off = p.billing === 'monthly' ? 0 : Math.floor((1 - p.amount / 69.9) * 100);
            return (
              <article key={p.id} className={`store-card${planId === p.id ? ' is-picked' : ''}${p.promo ? ' is-bf' : ''}`}>
                <button type="button" className="store-card-im" onClick={() => pick(p.id)} tabIndex={-1} aria-hidden="true">
                  <img src={`/assets/plans/${p.id}.webp`} alt="" loading="lazy" />
                  {off > 0 && <span className="store-badge">-{off}%</span>}
                  {p.promo && <span className="store-badge store-badge--bf">{p.promo}</span>}
                  {p.billing !== 'monthly' && <span className="store-tag">Frete grátis</span>}
                </button>
                <div className="store-card-b">
                  <p className="store-card-k">{p.cycles === 12 ? '12 edições · melhor preço' : p.cycles === 6 ? '6 edições' : 'Todo mês'}</p>
                  <h3>{p.name}</h3>
                  <p className="store-price"><b>{p.price}</b>{off > 0 && <s>R$ 69,90</s>}{p.was && <s>{p.was}</s>}<em>{p.billing === 'monthly' ? '/edição + frete' : '/edição'}</em></p>
                  <p className={p.total ? 'store-total' : 'rv-note'}>{p.total || 'cancele quando quiser'}</p>
                  {p.gifts && <p className="store-gifts"><b>Black Friday:</b> vem com {p.gifts.join(', ').replace(/, ([^,]*)$/, ' e $1').toLowerCase()}</p>}
                  <button type="button" className="store-add" onClick={() => pick(p.id)} aria-pressed={planId === p.id}>{planId === p.id ? 'Escolhido ✓' : 'Assinar'}</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      </div>
      {children}
      <div className="ps-table">
    </div>
    </>
  );
}
