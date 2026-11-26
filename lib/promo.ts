// Black Friday: monthly plan for R$ 59,90 + frete, and extra gifts on every plan.
// It only switches on once the monthly Black Friday subscription link is set below,
// and switches itself off at the end of 30/11 (Brasília time).
import publication from './publication.json';

export const BLACK_FRIDAY = {
  until: '2026-12-01T03:00:00Z',
  mensal: { price: 'R$ 59,90', amount: 59.9, was: 'R$ 69,90', checkoutUrl: 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=516d332359844b30832d93147e4e789b' },
  gifts: ['Jogos', 'Surpresa do mês', 'Adesivos', 'Marcador de página'],
};

export const blackFridayOn = (now = Date.now()) => !!BLACK_FRIDAY.mensal.checkoutUrl && now < Date.parse(BLACK_FRIDAY.until);

type PlanIn = (typeof publication.printPlans)[number];
export type PromoPlan = PlanIn & { was?: string; promo?: string; gifts?: string[] };

/** The plans as they are sold right now (with the Black Friday changes while it runs). */
export function plansNow(now = Date.now()): PromoPlan[] {
  const on = blackFridayOn(now);
  return publication.printPlans.map((p) => {
    if (!on) return p;
    const m = BLACK_FRIDAY.mensal;
    return p.id === 'mensal'
      ? { ...p, price: m.price, amount: m.amount, checkoutUrl: m.checkoutUrl, was: m.was, promo: 'Black Friday', gifts: BLACK_FRIDAY.gifts }
      : { ...p, gifts: BLACK_FRIDAY.gifts };
  });
}
