import type { Metadata } from 'next';
import { existsSync } from 'fs';
import { join } from 'path';
import publication from '@/lib/publication.json';
import { plansNow } from '@/lib/promo';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import PrintSubscribe from '@/components/PrintSubscribe';
import Newsstand from '@/components/Newsstand';
import StickySubscribe from '@/components/StickySubscribe';
import { EditionsProvider } from '@/components/Editions';
import photoIds from '@/data/photos.json';
import excerpts from '@/data/excerpts.json';
import { loadArchive } from '@/lib/substack';
import { editionMeta } from '@/lib/editions';

const D = '/assets/drawn/';
// The December (Nº 01) cover becomes the featured magazine as soon as the file is in public/assets.
const DEC_COVER = existsSync(join(process.cwd(), 'public/assets/edicao-01-capa.webp')) ? '/assets/edicao-01-capa.webp' : null;

export const revalidate = 3600;

const FAQ: [string, string][] = [
  ['Quando recebo a minha primeira revista?', 'A pré-venda da edição de Natal vai até 1º de dezembro. No dia 1º mandamos imprimir, e a revista chega na sua casa até a segunda semana de dezembro. A partir daí, chega uma revista nova todo mês.'],
  ['Onde vocês entregam?', 'Por enquanto, só na Grande São Paulo. Você confere se o seu CEP está na área de entrega antes de pagar.'],
  ['Quanto custa o frete?', 'No plano mensal, o frete é calculado com base no seu CEP e adicionado ao valor da assinatura por mês no total. Nos planos semestral e anual, o frete é por nossa conta :)'],
  ['Como posso pagar?', 'O pagamento é feito pelo Mercado Pago. O mensal é cobrado no cartão todo mês. O semestral e o anual são pagos uma vez só: à vista no Pix ou parcelados no cartão.'],
  ['A assinatura renova sozinha?', 'O mensal renova todo mês até você cancelar. O semestral e o anual não renovam sozinhos: quando acabarem, você escolhe se quer continuar.'],
  ['Como cancelo?', 'O mensal pode ser cancelado quando você quiser, sem multa. É só escrever para thesundaymagazineac@gmail.com.'],
  ['Mudei de endereço. E agora?', 'Escreva para thesundaymagazineac@gmail.com com o endereço novo antes do envio da próxima edição.'],
];

export const metadata: Metadata = {
  title: 'Assine a revista impressa',
  description: 'Assine a The Sunday, revista impressa para mulheres curiosas, todo mês na sua casa. Planos mensal, semestral e anual. Pré-venda da edição de Natal.',
  alternates: { canonical: '/assinatura' },
};

export default async function Assinatura() {
  const { articles, popularIds } = await loadArchive();
  const photos = new Set<string>(photoIds);
  const editions = articles.map((article) => ({ article, meta: editionMeta(article, photos, excerpts as Record<string, string[]>) }));
  return (
    <EditionsProvider editions={editions} tagLabels={publication.tagLabels}>
      <SiteNav home={false} current="print" />
      <main className="ps ps-page">
        <PrintSubscribe plans={plansNow()} fixedFrete={publication.shipping.fixed} />

        <section className="rv-inside" aria-labelledby="kit">
          <h2 id="kit">O que chega na sua casa</h2>
          <div className="rv-tiles">
            <article className="rv-tile"><div className="rv-tile-im rv-tile-im--cover"><img src={DEC_COVER || '/assets/edicao-00-capa.webp'} alt="Capa da edição de Natal" /></div><div className="rv-tile-b"><h3>A revista</h3><p>Chega na sua casa com conteúdos exclusivos, para ler e colecionar.</p></div></article>
            <article className="rv-tile"><div className="rv-tile-im"><img src="/assets/kit-jogos.webp" alt="Sudoku e café" loading="lazy" /></div><div className="rv-tile-b"><h3>Jogos</h3><p>Sudoku, caça-palavras e outros passatempos dentro da revista.</p></div></article>
            <article className="rv-tile"><div className="rv-tile-im"><img src="/assets/kit-surpresa.webp" alt="Biscoitos de Natal decorados" loading="lazy" /></div><div className="rv-tile-b"><h3>Surpresa do mês</h3><p>Um mimo diferente a cada edição. Esta vai ser a sua receita de Natal.</p></div></article>
          </div>
        </section>
        <section className="ps-faq" aria-labelledby="faq-h">
          <p className="ps-eyebrow">Perguntas frequentes</p>
          <h2 id="faq-h" className="ps-h2">Antes de assinar</h2>
          {FAQ.map(([q, a]) => (
            <details key={q} className="ps-faq-item">
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>

        {/* The collection on the coffee table, then one last invitation. */}
        <div className="ps-cover">
          <Newsstand popularIds={popularIds} locale={publication.locale} eyebrow="A coleção" title="Uma coleção para guardar" intro="Cada mês, uma nova edição. Histórias diferentes, capas para colecionar e assuntos que merecem voltar à conversa. Toque numa capa para ler." controls={false} />
        </div>
        <section className="ps-close">
          <p className="ps-close-h">Sente-se, a mesa está posta.</p>
          <a className="ps-cta" href="#planos">Quero a minha <span aria-hidden="true">↑</span></a>
        </section>
        <StickySubscribe />
      </main>
      <SiteFooter />
    </EditionsProvider>
  );
}
