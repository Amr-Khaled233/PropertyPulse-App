// Core real-estate investment calculations — mirrors the backend shared-utils
// engine so client-side previews (analysis/report/scenario screens) match the
// server's numbers exactly. Pure functions, no side effects.

import type { FinancialAssumptions, InvestmentMetrics } from '../types/analysis';

// Tuned for the Egyptian market (large down payments / developer installments,
// fast nominal appreciation). Appreciation, not leverage, drives returns.
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
  low: '#0B9972',
  moderate: '#D4850A',
  high: '#C0392B',
} as const;

/** Typical monthly rent per m² (EGP) by property type — Cairo/Giza market. */
export const RENT_PER_SQM_BY_TYPE: Record<string, number> = {
  apartment: 320,
  house: 300,
  villa: 250,
  townhouse: 280,
  commercial: 450,
  land: 60,
};

export function estimateMonthlyRent(areaSqm: number, type: string): number {
  const rate = RENT_PER_SQM_BY_TYPE[type] ?? 300;
  return Math.round(Math.max(0, areaSqm) * rate);
}

/** Monthly mortgage payment using the standard amortization formula. */
export function monthlyMortgagePayment(
  principal: number,
  annualInterestRate: number,
  termYears: number,
): number {
  if (principal <= 0) return 0;
  const r = annualInterestRate / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function grossRentalYield(annualRent: number, price: number): number {
  return price > 0 ? (annualRent / price) * 100 : 0;
}

export function netRentalYield(annualRent: number, annualExpenses: number, price: number): number {
  return price > 0 ? ((annualRent - annualExpenses) / price) * 100 : 0;
}

export function capRate(netOperatingIncome: number, price: number): number {
  return price > 0 ? (netOperatingIncome / price) * 100 : 0;
}

/** Compute the full set of investment metrics from a set of assumptions. */
export function computeInvestmentMetrics(a: FinancialAssumptions): InvestmentMetrics {
  const downPayment = a.purchasePrice * (a.downPaymentPct / 100);
  const loanAmount = a.purchasePrice - downPayment;
  const cashInvested = downPayment + a.closingCosts;

  const effectiveMonthlyRent = a.monthlyRent * (1 - a.vacancyRatePct / 100);
  const annualRent = effectiveMonthlyRent * 12;
  const annualExpenses = a.monthlyExpenses * 12;
  const noi = annualRent - annualExpenses;

  const mortgage = monthlyMortgagePayment(loanAmount, a.loanInterestRate, a.loanTermYears);
  const monthlyCashFlow = effectiveMonthlyRent - a.monthlyExpenses - mortgage;
  const annualCashFlow = monthlyCashFlow * 12;

  const fiveYearAppreciation = a.purchasePrice * (Math.pow(1 + a.annualAppreciationPct / 100, 5) - 1);
  const fiveYearRoi = cashInvested > 0 ? ((annualCashFlow * 5 + fiveYearAppreciation) / cashInvested) * 100 : 0;

  return {
    grossRentalYield: grossRentalYield(annualRent, a.purchasePrice),
    netRentalYield: netRentalYield(annualRent, annualExpenses, a.purchasePrice),
    capRate: capRate(noi, a.purchasePrice),
    cashOnCashReturn: cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : 0,
    monthlyCashFlow,
    annualCashFlow,
    breakEvenYears: annualCashFlow > 0 ? cashInvested / annualCashFlow : Infinity,
    fiveYearRoi,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : 0));
}

export type Recommendation = 'buy' | 'hold' | 'avoid';

/** Deterministic buy/hold/avoid recommendation from metrics + price position. */
export function deriveRecommendation(
  m: InvestmentMetrics,
  pricePositionPct = 0,
): { recommendation: Recommendation; confidence: number; score: number } {
  let score = 50;
  score += (m.capRate - 6) * 4;
  score += clamp(m.cashOnCashReturn, -20, 20) * 1.2;
  score += clamp(m.fiveYearRoi, -50, 150) * 0.22;
  score -= clamp(pricePositionPct, -60, 60) * 1.1;
  score = clamp(score, 0, 100);

  const recommendation: Recommendation = score >= 62 ? 'buy' : score >= 42 ? 'hold' : 'avoid';
  const confidence = Math.round((0.62 + Math.abs(score - 50) / 130) * 100) / 100;
  return { recommendation, confidence: Math.min(confidence, 0.97), score: Math.round(score) };
}

/** Build a full assumptions object for a property price (mirrors web buildAssumptions). */
export function buildAssumptions(
  price: number,
  overrides: Partial<FinancialAssumptions> = {},
): FinancialAssumptions {
  const purchasePrice = overrides.purchasePrice ?? price;
  const monthlyRent = overrides.monthlyRent ?? Math.round(purchasePrice * 0.005);
  return {
    purchasePrice,
    downPaymentPct: overrides.downPaymentPct ?? DEFAULT_ASSUMPTIONS.downPaymentPct,
    loanInterestRate: overrides.loanInterestRate ?? DEFAULT_ASSUMPTIONS.loanInterestRate,
    loanTermYears: overrides.loanTermYears ?? DEFAULT_ASSUMPTIONS.loanTermYears,
    monthlyRent,
    vacancyRatePct: overrides.vacancyRatePct ?? DEFAULT_ASSUMPTIONS.vacancyRatePct,
    monthlyExpenses: overrides.monthlyExpenses ?? Math.round(monthlyRent * 0.3),
    annualAppreciationPct: overrides.annualAppreciationPct ?? DEFAULT_ASSUMPTIONS.annualAppreciationPct,
    closingCosts: overrides.closingCosts ?? Math.round(purchasePrice * 0.03),
  };
}
