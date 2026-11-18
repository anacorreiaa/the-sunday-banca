import publication from '@/lib/publication.json';
import Newsstand from '@/components/Newsstand';
import SuggestionForm from '@/components/SuggestionForm';
import { coversFor, loadArchive } from '@/lib/substack';
import { isConfigured } from '@/lib/recommend';

export const revalidate = 3600;

export default async function Home() {
  const { articles, popularIds } = await loadArchive();
  const covers = coversFor(articles);
  const formEnabled = !process.env.PREVIEW_EXPORT && isConfigured();
  const wm = publication.wordmark;

  return (
    <>
      <a className="skip" href="#archive">Pular para as edições</a>
      <header className="topbar">
        <a className="topbar-author" href={publication.substackUrl}>{publication.author}</a>
        <span className="topbar-center">Uma publicação no Substack</span>
        <a className="topbar-subscribe" href={publication.subscribeUrl}>Assinar <span aria-hidden="true">↗</span></a>
      </header>

      <main>
        <h1 className="identity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wm.src} alt={wm.alt} width={wm.width} height={wm.height} className="wordmark" />
        </h1>

        <div className="intro">
          <SuggestionForm copy={publication.suggestions} enabled={formEnabled} />
          <div className="about">
            <p className="about-lead">{publication.description}</p>
            <p>Cada edição é uma revista nesta banca. Escolha uma pela capa, folheie a prévia e continue a leitura no Substack.</p>
          </div>
        </div>

        <div id="archive">
          {articles.length > 0 ? (
            <Newsstand articles={articles} popularIds={popularIds} covers={covers} tagLabels={publication.tagLabels} locale={publication.locale} />
          ) : (
            <p className="empty">Não conseguimos carregar as edições agora. Elas continuam todas no <a href={publication.substackUrl}>Substack</a>.</p>
          )}
        </div>
      </main>

      <footer className="footer">
        <span>{publication.tagline}</span>
        <a href={publication.substackUrl}>thesundaymagazine.substack.com</a>
      </footer>
    </>
  );
}
