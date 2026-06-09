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