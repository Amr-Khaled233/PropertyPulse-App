// Shared constants and sensible defaults used across apps.

// Tuned for the Egyptian market: buyers typically put a large down payment
// (or pay in developer installments), and nominal prices appreciate fast with
// inflation/EGP moves — so appreciation, not leverage, drives returns.
export const DEFAULT_ASSUMPTIONS = {
  downPaymentPct: 40,
  loanInterestRate: 6.5,
  loanTermYears: 20,
  vacancyRatePct: 8,
  annualAppreciationPct: 12,
} as const;

export const RECOMMENDATION_LABELS = {
  buy: 'Strong Buy',
  hold: 'Hold / Watch',
  avoid: 'Avoid',
} as const;

export const RISK_COLORS = {
  low: '#16a34a',
  moderate: '#d97706',
  high: '#dc2626',
} as const;
