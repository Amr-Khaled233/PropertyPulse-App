// Agent orchestrator — coordinates the end-to-end analysis pipeline that turns a
// property + user assumptions into a complete InvestmentReport (minus persistence).

import type {
  Property,
  FinancialAssumptions,
  InvestmentReport,
} from '@propertypulse/shared-types';
import { collectPropertyData } from './dataCollectorAgent.js';
import { collectMarketData } from './marketDataAgent.js';
import { calculateMetrics, type AssumptionOverrides } from './calculationAgent.js';
import { generateReport } from './reportGeneratorAgent.js';
import { logger } from '../../utils/logger.js';

export interface AnalysisInput {
  property: Property;
  userId: string;
  assumptions?: AssumptionOverrides;
  lang?: 'en' | 'ar';
}

/** The report payload without the DB-generated id/timestamp. */
export type AnalysisOutput = Omit<InvestmentReport, 'id' | 'generatedAt'> & {
  assumptions: FinancialAssumptions;
};

export async function runAnalysisPipeline(input: AnalysisInput): Promise<AnalysisOutput> {
  const property = await collectPropertyData(input.property);
  logger.debug({ propertyId: property.id }, 'Pipeline: property collected');

  const market = await collectMarketData(property);
  logger.debug({ propertyId: property.id }, 'Pipeline: market data collected');

  const { assumptions, metrics } = calculateMetrics(property, input.assumptions);
  logger.debug({ propertyId: property.id }, 'Pipeline: metrics computed');

  const generated = await generateReport({ property, metrics, market, lang: input.lang });
  logger.debug({ propertyId: property.id }, 'Pipeline: report generated');

  return {
    propertyId: property.id,
    userId: input.userId,
    summary: generated.summary,
    recommendation: generated.recommendation,
    confidence: generated.confidence,
    metrics,
    risk: generated.risk,
    marketTrends: market.trends,
    neighborhood: market.neighborhood,
    sources: market.retrieval.sources.length ? market.retrieval.sources : ['PropertyPulse market dataset'],
    assumptions,
  };
}
