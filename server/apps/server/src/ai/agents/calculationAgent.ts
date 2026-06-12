// Calculation agent — turns a property + partial user assumptions into a complete set
// of deterministic financial metrics. All numbers come from @propertypulse/shared-utils,
// never from the LLM, which keeps the report's figures trustworthy and reproducible.

import type { Property, FinancialAssumptions, InvestmentMetrics } from '@propertypulse/shared-types';
import { computeInvestmentMetrics, estimateMonthlyRent } from '@propertypulse/shared-utils';
import { DEFAULT_ASSUMPTIONS } from '@propertypulse/shared-utils';

export type AssumptionOverrides = Partial<FinancialAssumptions>;

/** Build a full assumptions object, filling gaps with sensible market defaults. */
export function buildAssumptions(property: Property, overrides: AssumptionOverrides = {}): FinancialAssumptions {
  const purchasePrice = overrides.purchasePrice ?? property.price;
  // Estimate rent from AREA + type (not a flat % of price) so the rental yield
  // varies per property by its price/m². Expenses ≈ 30% of rent.
  const monthlyRent = overrides.monthlyRent ?? estimateMonthlyRent(property.areaSqm, property.type);
  const monthlyExpenses = overrides.monthlyExpenses ?? Math.round(monthlyRent * 0.3);

  return {
    purchasePrice,
    downPaymentPct: overrides.downPaymentPct ?? DEFAULT_ASSUMPTIONS.downPaymentPct,
    loanInterestRate: overrides.loanInterestRate ?? DEFAULT_ASSUMPTIONS.loanInterestRate,
    loanTermYears: overrides.loanTermYears ?? DEFAULT_ASSUMPTIONS.loanTermYears,
    monthlyRent,
    vacancyRatePct: overrides.vacancyRatePct ?? DEFAULT_ASSUMPTIONS.vacancyRatePct,
    monthlyExpenses,
    annualAppreciationPct: overrides.annualAppreciationPct ?? DEFAULT_ASSUMPTIONS.annualAppreciationPct,
    closingCosts: overrides.closingCosts ?? Math.round(purchasePrice * 0.03),
  };
}

export function calculateMetrics(property: Property, overrides: AssumptionOverrides = {}): {
  assumptions: FinancialAssumptions;
  metrics: InvestmentMetrics;
} {
  const assumptions = buildAssumptions(property, overrides);
  const metrics = computeInvestmentMetrics(assumptions);
  return { assumptions, metrics };
}
