import { i18n } from '../i18';

export function formatCurrency(value: number, currency = 'EGP'): string {
  return `${value.toLocaleString()} ${currency}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function formatArea(value: number, unit = 'sqm'): string {
  return `${value.toLocaleString()} ${unit}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Compact money, e.g. 24_800_000 -> "24.8M", 450_000 -> "450k". */
export function formatCompact(value: number, currency?: string): string {
  const abs = Math.abs(value);
  let out: string;
  if (abs >= 1_000_000_000) out = `${(value / 1_000_000_000).toFixed(1)}B`;
  else if (abs >= 1_000_000) out = `${(value / 1_000_000).toFixed(1)}M`;
  else if (abs >= 1_000) out = `${Math.round(value / 1_000)}k`;
  else out = `${value}`;
  return currency ? `${out} ${currency}` : out;
}

/** Money with a leading symbol used on cards, e.g. "$450k". */
export function formatPrice(value: number): string {
  return `$${formatCompact(value)}`;
}

/** Signed money for cash-flow rows, e.g. "+12,000 EGP" / "-7,500 EGP". */
export function formatSigned(value: number, currency = 'EGP'): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toLocaleString()} ${currency}`;
}

/** Compact currency with the code suffix, e.g. "9.3M EGP" / "850k EGP". */
export function formatCompactCurrency(value: number, currency = 'EGP'): string {
  return formatCompact(value, currency);
}

/** "3 bed · 2 bath · 120 m²" style summary line (unit labels localized). */
export function formatPropertySpecs(bedrooms: number, bathrooms: number, areaSqm: number): string {
  return `${bedrooms} ${i18n.t('unit.bed')} · ${bathrooms} ${i18n.t('unit.bath')} · ${areaSqm.toLocaleString()} ${i18n.t('unit.sqm')}`;
}

/** Years value that may be Infinity / null (never breaks even). */
export function formatYears(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value.toFixed(1)} ${i18n.t('unit.yrs')}`;
}

/**
 * Localized short month label for chart axes, e.g. "May 26" / "مايو 26".
 * Accepts an ISO-ish period ("2026-05" or "2026-05-01"). Numbers stay Latin
 * so they read correctly inside an RTL Arabic label.
 */
export function formatMonthShort(period: string): string {
  const d = new Date(period.length === 7 ? `${period}-01` : period);
  if (Number.isNaN(d.getTime())) return period.slice(0, 7);
  const locale = i18n.language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US';
  return d.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
}

/** Whole-number percent, e.g. 7.4 → "7.4%". */
export function formatPct(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(digits)}%`;
}