// Top of the home page: one big Christmas photo with the pre-sale call.
// Photo: Fabien Maurin on Unsplash (Unsplash License, free for commercial use).

export default function StoreHero() {
  return (
    <section className="store-hero" id="topo">
      <picture>
        <source media="(max-width: 760px)" srcSet="/assets/topo-natal-m.webp" />
        <img src="/assets/topo-natal.webp" alt="Bolas de Natal vermelhas e uma estrela na árvore" fetchPriority="high" />
      </picture>
      <div className="store-hero-text">
        <p className="store-kick">Edição Nº 01 · Dezembro</p>
        <h1>A edição de<br />Natal chegou.</h1>
        <p>Pré-venda até 1º de dezembro.</p>
        <a className="store-btn" href="#assinaturas">Garantir a minha <span aria-hidden="true">→</span></a>
      </div>
      <a className="store-credit" href="https://unsplash.com/photos/a-christmas-tree-with-ornaments-gMQXz9iYJ64" target="_blank" rel="noopener">Foto: Fabien Maurin / Unsplash</a>
    </section>
  );
}
