import type { Metadata } from 'next';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = { title: 'Minha assinatura', robots: { index: false, follow: false } };

// Until subscriber accounts exist: where to manage the subscription today.
export default function MinhaAssinatura() {
  return (
    <>
      <SiteNav home={false} />
      <main className="ps ps-thanks">
        <div className="ps-table ps-thanks-table">
          <div className="ps-envelope ps-thanks-card">
            <img className="ps-carta" src="/assets/drawn/carta.png" alt="" aria-hidden="true" />
            <h1>Minha assinatura</h1>
            <p className="ps-thanks-plan">Para ver os seus pagamentos ou cancelar o plano mensal, entre no Mercado Pago com o e-mail que você usou ao assinar e abra <strong>Assinaturas</strong>.</p>
            <p className="ps-thanks-small">Quer mudar o endereço, saber quando chega a próxima revista ou tirar alguma dúvida? Fale com a gente pelo Instagram <a href="https://www.instagram.com/thesunday.ac/">@thesunday.ac</a> ou pelo e-mail <a href="mailto:thesundaymagazineac@gmail.com">thesundaymagazineac@gmail.com</a>.</p>
            <a className="ps-cta" href="https://www.mercadopago.com.br/subscriptions">Abrir no Mercado Pago</a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
