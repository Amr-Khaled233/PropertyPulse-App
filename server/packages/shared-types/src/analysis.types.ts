// Types for investment analysis inputs and computed metrics.

export interface FinancialAssumptions {
  purchasePrice: number;
  downPaymentPct: number;
  loanInterestRate: number;
  loanTermYears: number;
  monthlyRent: number;
  vacancyRatePct: number;
  monthlyExpenses: number;
  annualAppreciationPct: number;
  closingCosts: number;
}

export interface InvestmentMetrics {
  grossRentalYield: number;
  netRentalYield: number;
  capRate: number;
  cashOnCashReturn: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  breakEvenYears: number;
  fiveYearRoi: number;
}

export type RiskLevel = 'low' | 'moderate' | 'high';

export interface RiskFactor {
  name: string;
  level: RiskLevel;
  weight: number;
  explanation: string;
}

export interface RiskAssessment {
  overall: RiskLevel;
  score: number; // 0-100
  factors: RiskFactor[];
}
