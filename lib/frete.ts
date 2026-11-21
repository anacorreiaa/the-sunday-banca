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

async function getJson(url: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 5000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, next: { revalidate: 60 * 60 * 24 * 30 } });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Latitude and longitude of a CEP, from two free public services. */
export async function locate(cep: string): Promise<Place | null> {
  const a = await getJson(`https://cep.awesomeapi.com.br/json/${cep}`);
  if (a && a.lat && a.lng) return { lat: Number(a.lat), lng: Number(a.lng) };
  const b = await getJson(`https://brasilapi.com.br/api/cep/v2/${cep}`);
  const c = b?.location?.coordinates;
  if (c && c.latitude && c.longitude) return { lat: Number(c.latitude), lng: Number(c.longitude) };
  return null;
}

export type Quote = { ok: true; price: number; km: number; from: string } | { ok: false; reason: 'out' | 'unknown' };

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
  return quoteFor(place);
}
