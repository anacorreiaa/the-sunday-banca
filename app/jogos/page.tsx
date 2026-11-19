import type { Metadata } from 'next';
import publication from '@/lib/publication.json';
import SiteNav from '@/components/SiteNav';
import GamesRoom from '@/components/GamesRoom';

export const metadata: Metadata = {
  title: 'Sala de Jogos · The Sunday',
  description: 'Quebra-cabeça, Palavritas, sudoku e caça-palavras para um domingo sem pressa.',
};

export default function Jogos() {
  return (
    <>
      <SiteNav home={false} />
      <main className="games-main">
        <GamesRoom />
      </main>
      <footer className="footer">
        <span>{publication.tagline}</span>
        <a href={publication.substackUrl}>thesundaymagazine.substack.com</a>
      </footer>
    </>
  );
}
