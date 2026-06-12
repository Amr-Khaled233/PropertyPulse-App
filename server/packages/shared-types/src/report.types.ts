// Types for AI-generated investment reports.

import type { InvestmentMetrics, RiskAssessment } from './analysis.types';

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

export interface InvestmentReport {
  id: string;
  propertyId: string;
  userId: string;
  summary: string;
  recommendation: 'buy' | 'hold' | 'avoid';
  confidence: number; // 0-1
  metrics: InvestmentMetrics;
  risk: RiskAssessment;
  marketTrends: MarketTrendPoint[];
  neighborhood?: NeighborhoodInsight;
  sources: string[];
  generatedAt: string;
}
