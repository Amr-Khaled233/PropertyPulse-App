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
