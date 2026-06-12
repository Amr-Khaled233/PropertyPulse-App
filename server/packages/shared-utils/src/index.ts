// Barrel export for shared utilities.
// Named re-exports (not `export *`) so Node's ESM loader can statically resolve
// each symbol — `export *` re-exports aren't always seen as named exports by tsx.

export {
  monthlyMortgagePayment,
  grossRentalYield,
  netRentalYield,
  capRate,
  computeInvestmentMetrics,
  deriveRecommendation,
  estimateMonthlyRent,
  median,
  RENT_PER_SQM_BY_TYPE,
  type Recommendation,
} from './financial';

export { formatCurrency, formatPercent, formatArea, formatDate } from './formatters';

export { DEFAULT_ASSUMPTIONS, RECOMMENDATION_LABELS, RISK_COLORS } from './constants';
