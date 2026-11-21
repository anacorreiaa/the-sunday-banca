import type { Metadata } from 'next';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import ThanksCelebrate from '@/components/ThanksCelebrate';

export const metadata: Metadata = {
  title: 'Obrigada! · The Sunday Magazine',
  robots: { index: false, follow: false },
};

export default async function Obrigada({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const test = q.teste === '1';
  return (
    <>
      <SiteNav home={false} />
      <main className="ps ps-thanks">
        <div className="ps-table ps-thanks-table">
          <div className="ps-envelope ps-thanks-card">
            <div className="ps-selo" aria-hidden="true"><img src="/assets/drawn/vase.webp" alt="" /></div>
            {test && <p className="ps-mp-badge">Teste · nada foi cobrado</p>}
            <h1>Que alegria ter você na nossa mesa.</h1>
            <p className="ps-thanks-plan">
              {q.plano ? <>Plano <strong>{q.plano}</strong>{q.total ? <> · {q.total}</> : null}</> : 'Sua assinatura foi recebida.'}
            </p>
            <p className="ps-next-ed">A próxima edição é a de <strong>Natal</strong>, em dezembro, e ela vai direto para a sua casa.</p>
            <p className="ps-thanks-small">Qualquer dúvida, fale com a gente pelo Instagram <a href="https://www.instagram.com/thesunday.ac/">@thesunday.ac</a> ou pelo e-mail <a href="mailto:thesundaymagazineac@gmail.com">thesundaymagazineac@gmail.com</a>.</p>
            <a className="ps-cta" href="/">Voltar para a The Sunday</a>
          </div>
        </div>
        <ThanksCelebrate />
      </main>
      <SiteFooter />
    </>
  );
}
