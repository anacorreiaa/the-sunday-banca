import type { Metadata } from 'next';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import GamesRoom from '@/components/GamesRoom';

export const metadata: Metadata = {
  title: 'Sala de Jogos',
  alternates: { canonical: '/jogos' },
  description: 'Quebra-cabeça, Palavritas, sudoku e caça-palavras para um domingo sem pressa.',
};

export default function Jogos() {
  return (
    <>
      <SiteNav home={false} current="games" />
      <main className="games-main">
        <GamesRoom />
      </main>
      <SiteFooter />
    </>
  );
}
