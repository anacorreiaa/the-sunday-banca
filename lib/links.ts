// Page links that work both on the live site (/jogos) and in the static design preview (jogos.html).
const preview = process.env.NEXT_PUBLIC_PREVIEW === '1';
export const homeHref = preview ? 'index.html' : '/';
export const gamesHref = preview ? 'jogos.html' : '/jogos';
export const newsHref = preview ? 'newsletter.html' : '/newsletter';
