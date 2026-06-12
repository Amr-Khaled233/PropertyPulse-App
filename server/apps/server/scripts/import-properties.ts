// ============================================================
// Import YOUR own property dataset into Supabase (Cairo + Giza only).
//
// Why this exists: the dataset file was too large to paste/upload, so instead
// of hand-writing SQL you drop the file locally and this script loads it.
//
// HOW TO USE
//   1. Put your data file here (pick ONE):
//        supabase/data/properties.json   (recommended — array of objects)
//        supabase/data/properties.csv    (header row + rows)
//   2. From the repo root run:
//        npm run import:properties --workspace @propertypulse/server
//   3. Add --replace to delete the existing seeded properties first:
//        npm run import:properties --workspace @propertypulse/server -- --replace
//
// The script keeps ONLY rows whose city is in Cairo or Giza governorate
// (Cairo, New Cairo, Giza, 6th of October, Sheikh Zayed, Maadi, Heliopolis…),
// maps flexible column names, and inserts them in batches.
// Uses the server's service-role Supabase client (bypasses RLS).
// ============================================================

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { supabase } from '../src/config/supabase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');
const DATA_DIR = resolve(REPO_ROOT, 'supabase/data');

const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'townhouse', 'commercial', 'land'] as const;
const STATUSES = ['for_sale', 'for_rent', 'sold', 'off_market'] as const;

// Cities / districts that belong to Cairo or Giza governorate.
const CAIRO_GIZA = [
  'cairo', 'new cairo', 'nasr city', 'heliopolis', 'korba', 'maadi', 'zamalek',
  'downtown', 'fifth settlement', 'rehab', 'madinaty', 'shorouk', 'obour',
  'giza', '6th of october', '6 october', 'sixth of october', 'sheikh zayed',
  'zayed', 'dokki', 'mohandessin', 'haram', 'faisal', 'october', 'beverly hills',
];

interface RawRow {
  [key: string]: unknown;
}

interface PropertyInsert {
  title: string;
  type: string;
  status: string;
  price: number;
  currency: string;
  area_sqm: number;
  bedrooms: number;
  bathrooms: number;
  year_built: number | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  country: string;
  lat: number | null;
  lng: number | null;
  images: string[];
  description: string | null;
  source: string;
}

// --- tiny dependency-free CSV parser (handles quoted fields & commas) -------
function parseCsv(text: string): RawRow[] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1)
    .filter((r) => r.some((v) => v.trim() !== ''))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

// --- flexible field access --------------------------------------------------
function pick(row: RawRow, ...keys: string[]): unknown {
  const lower: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) lower[k.toLowerCase().trim()] = v;
  for (const key of keys) {
    const v = lower[key.toLowerCase()];
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return undefined;
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** Recover an area (m²) from a listing title like "villa 275m" / "165M apartment".
 *  Returns the first plausible 2–4 digit value (30–3000), or null. */
function areaFromTitle(title: string): number | null {
  if (!title) return null;
  // Negative lookbehind avoids grabbing digits inside a decimal price, e.g.
  // "2.85M" (2.85 million) must NOT yield 85.
  const re = /(?<![\d.])(\d{2,4})\s*(?:m²|m2|sqm|sq\.?\s*m|متر|mtr|square|m\b|M\b)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(title)) !== null) {
    const v = Number(m[1]);
    if (v >= 30 && v <= 3000) return v;
  }
  return null;
}

function normalizeType(v: unknown): string {
  const s = String(v ?? '').toLowerCase();
  if (PROPERTY_TYPES.includes(s as (typeof PROPERTY_TYPES)[number])) return s;
  if (s.includes('villa')) return 'villa';
  if (s.includes('town')) return 'townhouse';
  if (s.includes('office') || s.includes('shop') || s.includes('commerc') || s.includes('retail')) return 'commercial';
  if (s.includes('land') || s.includes('plot')) return 'land';
  if (s.includes('house') || s.includes('duplex')) return 'house';
  return 'apartment';
}

function normalizeStatus(v: unknown): string {
  const s = String(v ?? '').toLowerCase().replace(/\s+/g, '_');
  if (STATUSES.includes(s as (typeof STATUSES)[number])) return s;
  if (s.includes('rent')) return 'for_rent';
  if (s.includes('sold')) return 'sold';
  return 'for_sale';
}

function toImages(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === 'string' && v.trim()) return v.split(/[|;,]\s*/).map((s) => s.trim()).filter(Boolean);
  return [];
}

function inCairoGiza(city: string | null, address: string | null): boolean {
  const hay = `${city ?? ''} ${address ?? ''}`.toLowerCase();
  return CAIRO_GIZA.some((c) => hay.includes(c));
}

function mapRow(row: RawRow, includeRent: boolean): PropertyInsert | null {
  const city = (pick(row, 'city', 'governorate', 'region') as string | undefined)?.toString().trim() ?? null;
  const address = (pick(row, 'location_full', 'address', 'address_line1', 'location', 'town', 'district', 'subdistrict', 'compound', 'neighborhood') as string | undefined)?.toString().trim() ?? null;
  if (!inCairoGiza(city, address)) return null;

  const status = normalizeStatus(pick(row, 'offering_type', 'listing_type', 'status', 'listing_status', 'purpose'));
  // An investment advisor evaluates purchase price → ROI. Rent listings (price =
  // monthly rent) would poison those metrics, so by default we keep sale only.
  if (!includeRent && status === 'for_rent') return null;

  const price = num(pick(row, 'price_egp', 'price', 'amount', 'value'));

  const title = (pick(row, 'title', 'name', 'listing', 'headline') as string | undefined)?.toString().trim()
    || `${normalizeType(pick(row, 'property_type', 'type'))} in ${city ?? 'Cairo'}`;

  // The source dataset has ~8% of rows with a bad area_value (e.g. 1 or 20 m²
  // for a 275 m² villa). When the stored area is implausibly small, recover the
  // real size from the title (e.g. "villa 275m", "Apt. 195m", "165M apartment").
  let area = num(pick(row, 'area_value', 'area_sqm', 'area', 'size', 'sqm', 'space'));
  const titleArea = areaFromTitle(title);
  if (titleArea && (!area || area < 30)) area = titleArea;
  // Drop rows we still can't trust: a real Cairo/Giza listing is never < 30 m².
  if (!price || !area || area < 30) return null;

  // Data-quality gate on price/m² (EGP): listings priced far below market are
  // almost always a down-payment / quarterly instalment mislabelled as the price
  // (e.g. "445K per quarter"), and absurdly high ones are data errors. Both
  // corrupt the AI's valuation, so we drop them. Realistic Cairo/Giza band.
  const pricePerSqm = price / area;
  if (pricePerSqm < 10000 || pricePerSqm > 300000) return null;

  return {
    title,
    type: normalizeType(pick(row, 'property_type', 'type', 'category')),
    status,
    price,
    currency: (pick(row, 'price_currency', 'currency') as string | undefined)?.toString().trim() || 'EGP',
    area_sqm: area,
    bedrooms: num(pick(row, 'bedrooms', 'beds', 'rooms')) ?? 0,
    bathrooms: num(pick(row, 'bathrooms', 'baths')) ?? 0,
    year_built: num(pick(row, 'year_built', 'year', 'built')),
    address_line1: address,
    city,
    // We store the "town" (area within the governorate, e.g. New Cairo, Sheikh
    // Zayed, 6th of October) in `state` so it's filterable as a district.
    state: (pick(row, 'town', 'district', 'area', 'subdistrict', 'state') as string | undefined)?.toString().trim() ?? city,
    country: 'Egypt',
    lat: num(pick(row, 'lat', 'latitude')),
    lng: num(pick(row, 'lon', 'lng', 'long', 'longitude')),
    images: toImages(pick(row, 'images', 'image', 'photo', 'photos', 'image_url')),
    description: (pick(row, 'description', 'desc', 'details', 'about') as string | undefined)?.toString().trim() ?? null,
    source: 'user-dataset',
  };
}

async function main(): Promise<void> {
  const replace = process.argv.includes('--replace');
  const includeRent = process.argv.includes('--include-rent');
  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

  const jsonPath = resolve(DATA_DIR, 'properties.json');
  const csvPath = resolve(DATA_DIR, 'properties.csv');

  let rawRows: RawRow[];
  if (existsSync(jsonPath)) {
    const parsed = JSON.parse(readFileSync(jsonPath, 'utf8'));
    rawRows = Array.isArray(parsed) ? parsed : (parsed.properties ?? parsed.data ?? []);
    console.log(`Read ${rawRows.length} rows from properties.json`);
  } else if (existsSync(csvPath)) {
    rawRows = parseCsv(readFileSync(csvPath, 'utf8'));
    console.log(`Read ${rawRows.length} rows from properties.csv`);
  } else {
    console.error(`No data file found. Put your dataset at:\n  ${jsonPath}\n  or ${csvPath}`);
    process.exit(1);
  }

  let mapped = rawRows
    .map((r) => mapRow(r, includeRent))
    .filter((r): r is PropertyInsert => r !== null);
  if (Number.isFinite(limit)) mapped = mapped.slice(0, limit);
  console.log(
    `Kept ${mapped.length} Cairo/Giza rows after filtering & validation` +
      `${includeRent ? '' : ' (sale listings only — pass --include-rent to also load rentals)'}.`,
  );
  if (!mapped.length) {
    console.error('Nothing to insert — check your column names / city values.');
    process.exit(1);
  }

  if (process.argv.includes('--dry-run')) {
    console.log('\nDRY RUN — no database changes. Sample of first 3 rows:');
    console.log(JSON.stringify(mapped.slice(0, 3), null, 2));
    process.exit(0);
  }

  if (replace) {
    console.log('Deleting existing seeded properties (source = seed / user-dataset)…');
    // Delete in batches by id — a single delete over tens of thousands of rows
    // can exceed the statement timeout and fail with "fetch failed".
    let deleted = 0;
    for (;;) {
      const { data: ids, error: selErr } = await supabase
        .from('properties')
        .select('id')
        .in('source', ['seed', 'user-dataset'])
        .limit(100);
      if (selErr) { console.error('Select-for-delete failed:', selErr.message); process.exit(1); }
      if (!ids || ids.length === 0) break;
      const { error: delErr } = await supabase
        .from('properties')
        .delete()
        .in('id', ids.map((r) => (r as { id: string }).id));
      if (delErr) { console.error('Delete failed:', delErr.message); process.exit(1); }
      deleted += ids.length;
      console.log(`Deleted ${deleted}…`);
    }
  }

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < mapped.length; i += BATCH) {
    const batch = mapped.slice(i, i + BATCH);
    const { error } = await supabase.from('properties').insert(batch);
    if (error) { console.error(`Insert failed at batch ${i / BATCH}:`, error.message); process.exit(1); }
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${mapped.length}…`);
  }

  console.log(`\n✅ Done. ${inserted} Cairo/Giza properties are now in the database.`);
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
