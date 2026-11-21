// Shipping by motoboy from whichever of the two partners lives closer to the customer.
// Server only: the starting points never reach the browser. They are the centre of each
// neighbourhood, not anyone's address.
import 'server-only';
import publication from './publication.json';

const ORIGINS = [
  { who: 'Ana (Bela Vista)', lat: -23.5580, lng: -46.6450 },
  { who: 'Sócia (Itaim Bibi)', lat: -23.5840, lng: -46.6790 },
];
const ROAD = 1.3; // streets are longer than a straight line

type Place = { lat: number; lng: number };

function km(a: Place, b: Place) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const UA = { 'User-Agent': 'TheSundayMagazine/1.0 (https://www.thesunday.com.br; thesundaymagazineac@gmail.com)', Accept: 'application/json' };

async function getJson(url: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: UA, next: { revalidate: 60 * 60 * 24 * 30 } });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// BrasilAPI sometimes answers with the centre of the city instead of the street; that is useless for a motoboy.
const CITY_CENTRE = { lat: -23.5475, lng: -46.63611 };
const usable = (p: Place) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat - CITY_CENTRE.lat) + Math.abs(p.lng - CITY_CENTRE.lng) > 0.002;

/** Latitude and longitude of a CEP, trying several free public services in turn. */
export async function locate(cep: string): Promise<(Place & { src: string }) | null> {
  const a = await getJson(`https://cep.awesomeapi.com.br/json/${cep}`);
  if (a && a.lat && a.lng) {
    const p = { lat: Number(a.lat), lng: Number(a.lng) };
    if (usable(p)) return { ...p, src: 'a' };
  }
  // The street from ViaCEP, then its position from OpenStreetMap.
  const v = await getJson(`https://viacep.com.br/ws/${cep}/json/`);
  if (v && !v.erro && v.localidade) {
    const q = new URLSearchParams({ street: v.logradouro || '', city: v.localidade, state: v.uf || 'SP', country: 'Brasil', format: 'json', limit: '1' });
    const n = await getJson(`https://nominatim.openstreetmap.org/search?${q}`);
    if (Array.isArray(n) && n[0]) {
      const p = { lat: Number(n[0].lat), lng: Number(n[0].lon) };
      if (usable(p)) return { ...p, src: 'n' };
    }
  }
  const b = await getJson(`https://brasilapi.com.br/api/cep/v2/${cep}`);
  const c = b?.location?.coordinates;
  if (c && c.latitude && c.longitude) {
    const p = { lat: Number(c.latitude), lng: Number(c.longitude) };
    if (usable(p)) return { ...p, src: 'b' };
  }
  return null;
}

export type Quote = { ok: true; price: number; km: number; from: string; src?: string } | { ok: false; reason: 'out' | 'unknown' };

export function quoteFor(place: Place): Quote {
  const best = ORIGINS.map((o) => ({ o, d: km(o, place) * ROAD })).sort((x, y) => x.d - y.d)[0];
  const band = publication.shipping.bands.find((b) => best.d <= b.maxKm);
  if (!band) return { ok: false, reason: 'out' };
  return { ok: true, price: band.price, km: Math.round(best.d * 10) / 10, from: best.o.who };
}

export async function quote(cepRaw: string): Promise<Quote> {
  const cep = cepRaw.replace(/\D/g, '');
  if (cep.length !== 8) return { ok: false, reason: 'unknown' };
  const place = await locate(cep);
  if (!place) return { ok: false, reason: 'unknown' };
  return { ...quoteFor(place), src: place.src } as Quote;
}
