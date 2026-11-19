# Manutenção da banca

## Como o site se atualiza sozinho

- **Edições novas** aparecem sozinhas: o site consulta o Substack no máximo uma vez por hora, quando alguém visita a página. Se o Substack estiver fora do ar, ele usa a última cópia salva em `data/archive-snapshot.json`.
- **"Mais populares"** usa o ranking do próprio Substack (`sort=top`). Ele não representa visualizações exatas. Edições que ainda não estão no ranking entram no fim, das mais novas para as mais antigas.
- **Capas:** todas as capas são desenhadas pelo site no mesmo modelo (The Sunday em Pinyon Script, número ou série, data, foto do post e título). A cada deploy, o passo `prebuild` salva a foto de capa das edições novas em `public/assets/photos`. Até lá, a edição nova usa a foto direto do Substack.
- **Cores das capas:** Edições numeradas em Azul Ardósia, The Sunday Tips em Caramelo, The Sunday Curiosities em Tijolo (`lib/editions.ts`).
- **Estante da sala:** as edições mais recentes viram lombadas nos espaços vazios da estante (`components/Room.tsx`, até 21 lombadas). Todas continuam na banca com filtros, no fim da página.
- **Revista Quem somos:** o texto vem do About do Substack, guardado em `lib/about.json`. Se mudar o About, atualize esse arquivo.

Para guardar de vez as capas e os dados de uma edição nova, rode isto num computador com internet e faça commit:

```bash
npm run sync:archive   # atualiza data/archive-snapshot.json e data/popular-snapshot.json
npm run sync:covers    # baixa as fotos de capa que faltam para public/assets/photos + data/photos.json
```

Se preferir não usar o terminal: na Vercel, abra o projeto → Deployments → ⋯ → **Redeploy**.

## Onde chegam as sugestões

No seu Notion, na página **The Sunday — Sugestões dos leitores**, banco **Sugestões**. Cada envio chega com Status `New`. Não renomeie as colunas (`Suggestion`, `Message`, `Submitted`, `Status`, `Submission ID`, `Client Hash`), porque o site escreve nelas pelo nome.

- `Client Hash` é um código derivado do endereço do visitante, usado só para o limite de 5 envios por hora. O endereço em si nunca é guardado.
- Envios de teste começam com `[TESTE]`. Pode apagar.

## Trocar o token do Notion

1. Notion → Configurações → Conexões → *Develop or manage integrations* → integração **The Sunday Banca** → gere um novo token.
2. Na Vercel: Settings → Environment Variables → edite `NOTION_API_TOKEN` → **Redeploy**.
3. Faça um envio de teste e confira se chegou no Notion.

## Se o Substack mudar

Os endereços usados (`/api/v1/archive` e `/api/v1/press_kit/asset/...`) não são uma API oficial e podem mudar. Em novembro de 2026 o arquivo passou a responder `{ posts, nextCursor }` em vez de uma lista simples; o código aceita os dois formatos. Se a página parar de mostrar edições novas, o site continua no ar com a última cópia salva. A lógica de importação fica em `lib/archive-core.mjs`.

## Onde mexer

- Textos, nome, cores das tags, link de assinatura: `lib/publication.json`
- Cores e visual: `app/globals.css` (paleta do Guia Visual v3 no topo)
- Logo: `public/assets/wordmark.svg` (Pinyon Script + DM Sans, gerado por `scripts/tools/make_wordmark.py`)
- Madeira: `public/assets/worn-wood.webp` (textura original, gerada por `scripts/tools/make_wood.py`)
- Ilustrações da abertura, xícara, personagens e sala: `public/assets/scene/` (geradas no Canva, recortadas e otimizadas)
