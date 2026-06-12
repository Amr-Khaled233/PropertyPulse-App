// AI-generated investment report types — mirrors backend shared-types.

import type { InvestmentMetrics, RiskAssessment } from './analysis';

export interface MarketTrendPoint {
  period: string;
  medianPrice: number;
  medianRent: number;
}

export interface NeighborhoodInsight {
  name: string;
  walkScore?: number;
  safetyScore?: number;
  schoolsScore?: number;
  amenities: string[];
  summary: string;
}

export type Recommendation = 'buy' | 'hold' | 'avoid';

export interface InvestmentReport {
  id: string;
  propertyId: string;
  userId: string;
  summary: string;
  recommendation: Recommendation;
  confidence: number; // 0-1
  metrics: InvestmentMetrics;
  risk: RiskAssessment;
  marketTrends: MarketTrendPoint[];
  neighborhood?: NeighborhoodInsight;
  sources: string[];
  generatedAt: string;
}
