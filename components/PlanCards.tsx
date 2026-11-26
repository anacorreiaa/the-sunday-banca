// The subscriptions as product cards, plus the free newsletter. Prices come from publication.json.
import { newsHref } from '@/lib/links';
import { plansNow, blackFridayOn, type PromoPlan } from '@/lib/promo';

const FULL = 69.9; // monthly price, the reference for the discounts
const brl = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`;
const KICK: Record<string, string> = { anual: '12 edições · melhor preço', semestral: '6 edições', mensal: 'Todo mês' };

export default function PlanCards() {
  const plans = (plansNow() as PromoPlan[]).slice().sort((a, b) => (b.promo ? 1 : 0) - (a.promo ? 1 : 0) || b.cycles - a.cycles);
  const BF = blackFridayOn();
  return (
    <section className="store-plans" id="assinaturas" aria-labelledby="assinaturas-h">
      <div className="store-plans-head">
        <h2 id="assinaturas-h">Assinaturas</h2>
        <a href="/assinatura">ver todas</a>
      </div>
      <p className="store-plans-sub">Uma revista impressa por mês, na sua casa.</p>
      {BF && (
        <div className="bf-banner" role="note">
          <span className="bf-banner-k">Black Friday · até 30/11</span>
          <p className="bf-banner-t">Mensal de <s>R$ 69,90</s> <span>por <b>R$ 59,90</b> + frete</span></p>
          <p className="bf-banner-s">E em todos os planos: adesivos e marcador de página de brinde, junto com os jogos e a surpresa do mês.</p>
        </div>
      )}
      <div className="store-row">
        {plans.map((p) => {
          const off = p.billing === 'monthly' ? 0 : Math.floor((1 - p.amount / FULL) * 100);
          return (
            <article key={p.id} className={`store-card${p.promo ? ' is-bf' : ''}`}>
              <a className="store-card-im" href={`/assinatura?plano=${p.id}#planos`} tabIndex={-1} aria-hidden="true">
                <img src={`/assets/plans/${p.id}.webp`} alt="" loading="lazy" />
                {off > 0 && <span className="store-badge">-{off}%</span>}
                {p.promo && <span className="store-badge store-badge--bf">{p.promo}</span>}
                {p.billing !== 'monthly' && <span className="store-tag">Frete grátis</span>}
              </a>
              <div className="store-card-b">
                <p className="store-card-k">{KICK[p.id] || ''}</p>
                <h3>Assinatura {p.name}</h3>
                <p className="store-price">
                  <b>{p.price}</b>
                  {off > 0 && <s>{brl(FULL)}</s>}
                  {p.was && <s>{p.was}</s>}
                  <em>{p.billing === 'monthly' ? '/edição + frete' : '/edição'}</em>
                </p>
                {p.gifts && <p className="store-gifts"><b>Black Friday:</b> vem com {p.gifts.join(', ').replace(/, ([^,]*)$/, ' e $1').toLowerCase()}</p>}
                <a className="store-add" href={`/assinatura?plano=${p.id}#planos`}>Assinar</a>
              </div>
            </article>
          );
        })}
        <article className="store-card">
          <a className="store-card-im" href={newsHref} tabIndex={-1} aria-hidden="true">
            <img src="/assets/plans/devices.webp" alt="" loading="lazy" />
            <span className="store-tag">Grátis</span>
          </a>
          <div className="store-card-b">
            <p className="store-card-k">Todo domingo</p>
            <h3>Newsletter</h3>
            <p className="store-price"><b>R$ 0</b><em>no seu e-mail</em></p>
            <a className="store-add store-add--line" href={newsHref}>Quero receber</a>
          </div>
        </article>
      </div>
    </section>
  );
}
