// Core real-estate investment calculations shared across all apps.
// Pure functions — no side effects — so they are trivially testable and reusable
// by the server's calculation agent and by client-side previews.

import type { FinancialAssumptions, InvestmentMetrics } from '@propertypulse/shared-types';

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

/** Gross rental yield = annual rent / purchase price. */
export function grossRentalYield(annualRent: number, price: number): number {
  return price > 0 ? (annualRent / price) * 100 : 0;
}

/** Net rental yield = (annual rent - annual expenses) / price. */
export function netRentalYield(annualRent: number, annualExpenses: number, price: number): number {
  return price > 0 ? ((annualRent - annualExpenses) / price) * 100 : 0;
}

/** Capitalization rate = net operating income / property value. */
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

  const fiveYearAppreciation =
    a.purchasePrice * (Math.pow(1 + a.annualAppreciationPct / 100, 5) - 1);
  const fiveYearRoi =
    cashInvested > 0 ? ((annualCashFlow * 5 + fiveYearAppreciation) / cashInvested) * 100 : 0;

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

/** Typical monthly rent per m² (EGP) by property type — Cairo/Giza market.
 *  Estimating rent from AREA (not a flat % of price) makes the rental yield
 *  vary realistically per property: a unit priced cheaply per m² yields more,
 *  an expensive one yields less. */
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

/** Median of positive values — robust to luxury-listing outliers, unlike the
 *  mean. Used for "typical" comparable price/m² so fair-value and price-position
 *  estimates aren't dragged up by a few very expensive units. */
export function median(values: number[]): number {
  const v = values.filter((x) => x > 0).sort((a, b) => a - b);
  if (!v.length) return 0;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

export type Recommendation = 'buy' | 'hold' | 'avoid';

/**
 * Derive a grounded buy/hold/avoid recommendation from the computed metrics and
 * how the property is priced versus comparable listings. Deterministic (not
 * LLM-decided) so the verdict is consistent and actually varies by property:
 *  - strong total return + fair/undervalued pricing → buy
 *  - mixed → hold
 *  - weak yields + overpriced vs comps → avoid
 *
 * @param pricePositionPct  subject price/m² vs comparable average (+ = pricier).
 */
export function deriveRecommendation(
  m: InvestmentMetrics,
  pricePositionPct = 0,
): { recommendation: Recommendation; confidence: number; score: number } {
  let score = 50;
  score += (m.capRate - 6) * 4; // rental yield vs a 6% benchmark
  score += clamp(m.cashOnCashReturn, -15, 15) * 1.6; // operating cash return — a real differentiator
  // Appreciation-driven 5y ROI is high for almost EVERY unit in this market, so
  // it used to hit the cap and add a near-constant boost → everything scored a
  // "buy". Cap it lower and weight it lightly so yield, cash flow and pricing
  // (the things that actually differ per property) drive the verdict.
  score += clamp(m.fiveYearRoi, 0, 90) * 0.12;
  score -= clamp(pricePositionPct, -50, 50) * 1.3; // overpriced vs comparables hurts most
  score = clamp(score, 0, 100);

  const recommendation: Recommendation = score >= 62 ? 'buy' : score >= 42 ? 'hold' : 'avoid';
  const confidence = Math.round((0.62 + Math.abs(score - 50) / 130) * 100) / 100;
  return { recommendation, confidence: Math.min(confidence, 0.97), score: Math.round(score) };
}
