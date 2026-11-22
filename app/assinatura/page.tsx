import type { Metadata } from 'next';
import { existsSync } from 'fs';
import { join } from 'path';
import publication from '@/lib/publication.json';
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
  ['Quando recebo a minha primeira revista?', 'A sua assinatura começa pela próxima edição: a edição de Natal, em dezembro. A partir daí, chega uma revista nova todo mês.'],
  ['Onde vocês entregam?', 'Por enquanto, só na Grande São Paulo. Você confere se o seu CEP está na área de entrega antes de pagar.'],
  ['Quanto custa o frete?', 'No plano mensal, o frete é fixo: R$ 10 por mês, então você paga R$ 79,90 por mês no total. Nos planos semestral e anual, o frete é por nossa conta :)'],
  ['Como posso pagar?', 'O pagamento é feito pelo Mercado Pago. O mensal é cobrado no cartão todo mês. O semestral e o anual são pagos uma vez só: à vista no Pix ou parcelados no cartão (os juros do parcelamento ficam por conta de quem parcela).'],
  ['A assinatura renova sozinha?', 'O mensal renova todo mês até você cancelar. O semestral e o anual não renovam sozinhos: quando acabarem, você escolhe se quer continuar.'],
  ['Como cancelo?', 'O mensal pode ser cancelado quando você quiser, sem multa. É só escrever para thesundaymagazineac@gmail.com.'],
  ['Mudei de endereço. E agora?', 'Escreva para thesundaymagazineac@gmail.com com o endereço novo antes do envio da próxima edição.'],
];

export const metadata: Metadata = {
  title: 'Assine a revista impressa · The Sunday Magazine',
  description: 'A The Sunday impressa, todo mês na sua casa. Escolha o plano mensal, semestral ou anual.',
};

export default async function Assinatura() {
  const { articles, popularIds } = await loadArchive();
  const photos = new Set<string>(photoIds);
  const editions = articles.map((article) => ({ article, meta: editionMeta(article, photos, excerpts as Record<string, string[]>) }));
  return (
    <EditionsProvider editions={editions} tagLabels={publication.tagLabels}>
      <SiteNav home={false} current="print" />
      <main className="ps ps-page">
        {/* Opening: what The Sunday is, then what arrives at home */}
        <section className="ps-intro" aria-labelledby="ps-intro-h">
          <img className="deco deco--l" src={`${D}berries.webp`} alt="" aria-hidden="true" />
          <img className="deco deco--r" src={`${D}boat.webp`} alt="" aria-hidden="true" />
          <p className="ps-eyebrow">The Sunday Magazine</p>
          <h1 id="ps-intro-h" className="ps-intro-h">Uma boa leitura também pode chegar pelo correio.</h1>
          <p className="ps-intro-lead">Uma revista mensal para mulheres curiosas. Histórias, descobertas e pequenas surpresas para levar a vida além da rotina.</p>
          <a className="ps-cta" href="#planos">Ver os planos <span aria-hidden="true">↓</span></a>
        </section>

        <section className="ps-kit ps-kit--lead" aria-labelledby="kit">
          <p className="ps-eyebrow">A experiência The Sunday</p>
          <h2 id="kit" className="ps-h2">O que chega na sua casa</h2>
          <div className="ps-kit-hero">
            <div className="ps-kit-main">
              {DEC_COVER && <p className="ps-feature-tag">Em destaque · Dezembro 2026</p>}
              <div className="ps-kit-art ps-kit-art--mag" aria-hidden="true"><span className="ps-realmag"><img src={DEC_COVER || '/assets/edicao-00-capa.webp'} alt="" /></span></div>
              <h3>{DEC_COVER ? 'A edição de Natal' : 'A revista'}</h3>
              <p>Chega na sua casa todo mês com conteúdos exclusivos, para ler sem tela, e colecionar.</p>
            </div>
            <ul className="ps-kit-extras">
              <li>
                <div className="ps-kit-art ps-kit-art--small" aria-hidden="true">
                  <span className="ps-kit-page ps-kit-page--sudoku">
                    {[0, 1, 2, 3].map((g) => (
                      <span key={g} className="ps-kit-grid">{Array.from({ length: 16 }, (_, i) => <i key={i}>{(i * 7 + g * 3) % 5 === 0 ? ((i + g) % 9) + 1 : ''}</i>)}</span>
                    ))}
                  </span>
                </div>
                <h3>Jogos</h3>
                <p>Sudoku, caça-palavras e outros passatempos dentro da revista.</p>
              </li>
              <li>
                <div className="ps-kit-art ps-kit-art--small" aria-hidden="true">
                  <span className="ps-kit-recipe">
                    <span className="ps-kit-recipe-t">Surpresa do mês</span>
                    <span className="ps-kit-lines" />
                  </span>
                  <img className="ps-kit-recipe-d" src={`${D}berries.webp`} alt="" />
                </div>
                <h3>Surpresa do mês</h3>
                <p>Um mimo diferente a cada edição. Em dezembro, uma receita de Natal.</p>
              </li>
            </ul>
          </div>
        </section>

        <PrintSubscribe plans={publication.printPlans} fixedFrete={publication.shipping.fixed} />

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
