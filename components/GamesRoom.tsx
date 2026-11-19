'use client';

import { useState } from 'react';
import Jigsaw from './games/Jigsaw';
import Palavritas from './games/Palavritas';
import Sudoku from './games/Sudoku';
import CacaPalavras from './games/CacaPalavras';

const GAMES = [
  { id: 'quebra-cabeca', label: 'Quebra-cabeça', note: 'a foto do mês', C: Jigsaw },
  { id: 'palavritas', label: 'Palavritas', note: 'uma palavra por dia', C: Palavritas },
  { id: 'sudoku', label: 'Sudoku', note: 'nove por nove', C: Sudoku },
  { id: 'caca-palavras', label: 'Caça-palavras', note: 'palavras de domingo', C: CacaPalavras },
];

export default function GamesRoom() {
  const [tab, setTab] = useState(0);
  const G = GAMES[tab];
  return (
    <section className="games" aria-labelledby="games-heading">
      <header className="games-head">
        <p className="eyebrow">Para um domingo sem pressa</p>
        <h1 id="games-heading">Sala de Jogos</h1>
        <p className="games-lead">Pegue um café, escolha um jogo e fique à vontade.</p>
      </header>
      <div className="games-tabs" role="tablist" aria-label="Jogos">
        {GAMES.map((g, i) => (
          <button key={g.id} type="button" role="tab" aria-selected={tab === i} aria-controls="game-panel" id={`tab-${g.id}`} onClick={() => setTab(i)}>
            <span className="games-tab-name">{g.label}</span>
            <span className="games-tab-note">{g.note}</span>
          </button>
        ))}
      </div>
      <div className="games-panel" role="tabpanel" id="game-panel" aria-labelledby={`tab-${G.id}`}>
        <G.C key={G.id} />
      </div>
    </section>
  );
}
