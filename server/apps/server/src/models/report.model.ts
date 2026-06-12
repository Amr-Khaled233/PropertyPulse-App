// Investment report entity mapping: database row <-> domain InvestmentReport type.

import type {
  InvestmentReport,
  InvestmentMetrics,
  RiskAssessment,
  MarketTrendPoint,
  NeighborhoodInsight,
} from '@propertypulse/shared-types';

export interface ReportRow {
  id: string;
  property_id: string;
  user_id: string;
  summary: string;
  recommendation: InvestmentReport['recommendation'];
  confidence: number | string;
  metrics: InvestmentMetrics;
  risk: RiskAssessment;
  market_trends: MarketTrendPoint[];
  neighborhood: NeighborhoodInsight | null;
  sources: string[] | null;
  generated_at: string;
}

export function toReport(row: ReportRow): InvestmentReport {
  return {
    id: row.id,
    propertyId: row.property_id,
    userId: row.user_id,
    summary: row.summary,
    recommendation: row.recommendation,
    confidence: Number(row.confidence),
    metrics: row.metrics,
    risk: row.risk,
    marketTrends: row.market_trends ?? [],
    neighborhood: row.neighborhood ?? undefined,
    sources: row.sources ?? [],
    generatedAt: row.generated_at,
  };
}

export function toReportInsert(report: Omit<InvestmentReport, 'id' | 'generatedAt'>): Record<string, unknown> {
  return {
    property_id: report.propertyId,
    user_id: report.userId,
    summary: report.summary,
    recommendation: report.recommendation,
    confidence: report.confidence,
    metrics: report.metrics,
    risk: report.risk,
    market_trends: report.marketTrends,
    neighborhood: report.neighborhood ?? null,
    sources: report.sources,
  };
}
