// The plans on the home page, right after the magazine. Each tag opens the subscription page with that plan chosen.
import publication from '@/lib/publication.json';

type Plan = { id: string; name: string; price: string; per: string; desc: string; featured?: boolean; perk?: string };

export default function PlansPreview() {
  const plans = publication.printPlans as Plan[];
  return (
    <section className="ps ps-home-plans" aria-labelledby="planos-home">
      <div className="ps-table">
        <section className="ps-plans">
          <p className="ps-eyebrow ps-eyebrow--light">A revista impressa</p>
          <h2 id="planos-home" className="ps-h2 ps-h2--light">Receba a The Sunday em casa</h2>
          <div className="ps-tags">
            {plans.map((p, i) => (
              <article key={p.id} className={`ps-tag ps-tag--${i}${p.featured ? ' is-featured' : ''}`}>
                <div className="ps-tag-paper">
                  <span className="ps-tag-hole" aria-hidden="true" />
                  {p.featured && <span className="ps-stamp" aria-label="Melhor preço">melhor<br />preço</span>}
                  <h3>{p.name}</h3>
                  <p className="ps-price">{p.price}</p>
                  <p className="ps-per">{p.per}</p>
                  {p.perk && <p className="ps-perk">{p.perk}</p>}
                  <p className="ps-desc">{p.desc}</p>
                  <a className="ps-pick" href={`/assinatura?plano=${p.id}#planos`}>Escolher</a>
                </div>
              </article>
            ))}
          </div>
          <p className="ps-home-more"><a href="/assinatura">Ver o que vem na edição de Natal →</a></p>
        </section>
      </div>
    </section>
  );
}
