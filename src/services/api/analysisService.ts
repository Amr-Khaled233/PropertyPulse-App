// AI / financial analysis — consumes the backend (Gemini-backed). `lang`
// controls the language of AI text ('en' | 'ar').
//   POST /analysis/metrics     { propertyId, assumptions } → { assumptions, metrics }
//   POST /analysis/compare     { propertyIds, lang }        (Bearer)
//   POST /analysis/negotiation { propertyId, lang }

import { apiClient } from './apiClient';
import type { FinancialAssumptions, InvestmentMetrics } from '../../types/analysis';
import type { Property } from '../../types/listing';
import type { Recommendation } from '../../types/report';

export interface MetricsResult {
  assumptions: FinancialAssumptions;
  metrics: InvestmentMetrics;
}

export interface ComparisonCandidate {
  property: Property;
  metrics: InvestmentMetrics;
  recommendation: Recommendation;
  pricePerSqm: number;
  pricePositionPct: number;
}

export interface ComparisonResult {
  candidates: ComparisonCandidate[];
  ranking: { propertyId: string; rank: number; rationale: string }[];
  verdict: string;
}

export interface NegotiationResult {
  askingPrice: number;
  currency: string;
  fairValue: number;
  pricePerSqm: number;
  marketAvgPerSqm: number;
  deltaPct: number;
  suggestedOffer: number;
  compCount: number;
  tips: string[];
  summary: string;
}

export const analysisService = {
  async computeForProperty(
    propertyId: string,
    assumptions: Partial<FinancialAssumptions> = {},
  ): Promise<MetricsResult> {
    const { data } = await apiClient.post<MetricsResult>('/analysis/metrics', { propertyId, assumptions });
    return data;
  },

  async compare(propertyIds: string[], lang: 'en' | 'ar' = 'en'): Promise<ComparisonResult> {
    const { data } = await apiClient.post<ComparisonResult>('/analysis/compare', { propertyIds, lang }, 90_000);
    return data;
  },

  async negotiation(propertyId: string, lang: 'en' | 'ar' = 'en'): Promise<NegotiationResult> {
    const { data } = await apiClient.post<NegotiationResult>('/analysis/negotiation', { propertyId, lang }, 90_000);
    return data;
  },
};
