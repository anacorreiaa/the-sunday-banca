// The printed magazine on the table: words on the left, a fan of real issues on the right.
// Used at the top of the home page and of the subscription page.
import Cover from '@/components/Cover';
import type { Article } from '@/lib/types';
import type { EditionMeta } from '@/lib/editions';

const D = '/assets/drawn/';

export default function PrintHero({ fan, cta = '#planos', hint = false, h1 = true, home = false }: { fan: { article: Article; meta: EditionMeta }[]; cta?: string; hint?: boolean; h1?: boolean; home?: boolean }) {
  const Title = h1 ? 'h1' : 'h2';
  return (
    <section className="ps-hero" id={hint ? 'topo' : undefined}>
      <img className="ps-d ps-d--vase" src={`${D}vase.webp`} alt="" />
      {home
        ? <img className="ps-d ps-d--pajama" src={`${D}pajama.webp`} alt="" />
        : <img className="ps-d ps-d--berries" src={`${D}berries.webp`} alt="" />}
      {home
        ? <img className="ps-d ps-d--boat ps-d--toaster" src={`${D}toaster.webp`} alt="" />
        : <img className="ps-d ps-d--boat" src={`${D}boat.webp`} alt="" />}
      <div className="ps-hero-text">
        <p className="ps-eyebrow">A revista impressa</p>
        <Title><span className="ps-script">The Sunday</span><span className="ps-h1-sub">na sua casa, todo mês</span></Title>
        <p className="ps-lead">{home
          ? 'A newsletter chega todo domingo no seu e-mail e a revista chega na sua casa com conteúdos exclusivos, para ler sem tela, e colecionar.'
          : 'A newsletter chega todo domingo no seu e-mail. A revista chega impressa na sua casa, para ler sem tela, com café e sem pressa.'}</p>
        <a className="ps-cta" href={cta}>Quero a minha <span aria-hidden="true">↓</span></a>
      </div>
      <div className="ps-fan" aria-hidden="true">
        {fan.map((e, i) => (
          <div key={e.article.postId} className="ps-fan-mag" style={{ ['--i' as string]: i - (fan.length - 1) / 2 }}>
            <Cover article={e.article} meta={e.meta} />
          </div>
        ))}
        <img className="ps-fan-print" src="/assets/edicao-00-capa.webp" alt="" />
        <img className="ps-still-cup" src={`${D}cup-blue.webp`} alt="" />
      </div>
      {hint && <p className="hero-hint ps-hero-hint" aria-hidden="true">role para mergulhar ↓</p>}
    </section>
  );
}
