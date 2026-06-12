// Many dataset titles are raw scraper output, e.g.
// "(0 floor+1st floor+roof+garden 241m+pool)=cash dis". When a title looks like
// junk, synthesize a clean, human label from the structured fields instead.

import type { Property } from '../types/listing';

export function displayTitle(p: Property): string {
  const raw = (p.title ?? '').trim();
  const letters = raw.match(/[A-Za-z؀-ۿ]/g)?.length ?? 0;
  const looksJunky =
    !raw ||
    raw.length > 70 ||
    /[=+*]|\)\s*=|\d\s*\+\s*\d/.test(raw) || // math-y scraper noise
    letters < raw.length * 0.45; // mostly symbols/numbers

  if (!looksJunky) return raw;

  const type = p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : 'Property';
  const where = p.address?.city || p.address?.state || '';
  const beds = p.bedrooms ? `${p.bedrooms}-Bed ` : '';
  return `${beds}${type}${where ? ` · ${where}` : ''}`;
}
