// Display metadata for an edition: issue number, series, colour, short date, photo and excerpt.
import type { Article } from './types';

export type EditionMeta = {
  number: string | null; // "02" for numbered Edições
  series: string; // "Edição" | "The Sunday Tips" | "The Sunday Curiosities" ...
  label: string; // what the cover's top line says, e.g. "Nº 02" or "THE SUNDAY TIPS"
  color: string; // cover background
  ink: string; // text colour on the cover
  dateShort: string; // "15 NOV 2026"
  dateLong: string; // "15 de novembro de 2026"
  photo: string | null;
  excerpt: string[];
};

const ARDOSIA = '#4E5D68';
const CARAMELO = '#9A6C45';
const TIJOLO = '#7D3D33';
const NOGUEIRA = '#5B2F22';
const BRANCO = '#FAF8F3';

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

function parts(iso: string) {
  // Dates are shown in São Paulo time, where the publication lives.
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
  const [y, m, d] = f.format(new Date(iso)).split('-').map(Number);
  return { y, m, d };
}

export function editionMeta(a: Article, photos: Set<string>, excerpts: Record<string, string[]>): EditionMeta {
  const sub = a.subtitle || '';
  const num = sub.match(/^\s*(\d{1,3})\s*[-–—·]/);
  const seriesMatch = sub.match(/^\s*(The Sunday [A-Za-zÀ-ú]+)\s*[-–—]/);
  let series = 'Edição';
  let color = ARDOSIA;
  if (!num) {
    series = seriesMatch ? seriesMatch[1] : a.tags.find((t) => /tips/i.test(t)) ? 'The Sunday Tips' : a.tags[0] || 'The Sunday';
    color = /tips/i.test(series) ? CARAMELO : /curios/i.test(series) ? TIJOLO : NOGUEIRA;
  }
  const { y, m, d } = parts(a.date);
  const dateShort = `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
  const dateLong = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(new Date(a.date));
  const photo = photos.has(a.postId) ? `assets/photos/${a.postId}.webp` : a.coverImage;
  const excerpt = excerpts[a.postId]?.length ? excerpts[a.postId] : a.excerpt ? [a.excerpt] : a.subtitle ? [a.subtitle] : [];
  return {
    number: num ? num[1].padStart(2, '0') : null,
    series,
    label: num ? `Nº ${num[1].padStart(2, '0')}` : series.replace(/^The Sunday\s+/i, '').toUpperCase(),
    color,
    ink: BRANCO,
    dateShort,
    dateLong,
    photo,
    excerpt,
  };
}

/** Subtitle without the "02 - " or "The Sunday Tips - " prefix, for display under the title. */
export function cleanSubtitle(sub: string | null) {
  if (!sub) return null;
  return sub.replace(/^\s*(\d{1,3}|The Sunday [A-Za-zÀ-ú]+)\s*[-–—·]\s*/, '').trim() || null;
}
