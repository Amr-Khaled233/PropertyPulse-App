// Report generator agent — synthesizes the qualitative report. The numeric
// verdict + metrics are deterministic; the LLM only adds narrative/risk prose.
// If the LLM is unavailable (quota/outage) we fall back to a grounded,
// template-based report so generation NEVER hard-fails.

import type { Property, InvestmentMetrics, RiskAssessment, RiskLevel } from '@propertypulse/shared-types';
import { deriveRecommendation } from '@propertypulse/shared-utils';
import { geminiClient } from '../llm/geminiClient.js';
import { buildInvestmentReportPrompt } from '../llm/prompts/investmentReport.prompt.js';
import { buildRiskAssessmentPrompt } from '../llm/prompts/riskAssessment.prompt.js';
import { logger } from '../../utils/logger.js';
import type { MarketContext } from './marketDataAgent.js';

export interface GeneratedReport {
  risk: RiskAssessment;
  summary: string;
  recommendation: 'buy' | 'hold' | 'avoid';
  confidence: number;
}

interface NarrativeResponse {
  summary: string;
  recommendation: 'buy' | 'hold' | 'avoid';
  confidence: number;
}

const levelFor = (score: number): RiskLevel => (score < 34 ? 'low' : score < 67 ? 'moderate' : 'high');

/** Deterministic risk assessment from the metrics (used when the LLM is down). */
function fallbackRisk(metrics: InvestmentMetrics, pricePositionPct: number, verdictScore: number): RiskAssessment {
  const overallScore = Math.max(8, Math.min(92, 100 - verdictScore));
  const pricingLevel = levelFor(Math.min(95, Math.max(0, 40 + pricePositionPct)));
  const cashLevel: RiskLevel = metrics.monthlyCashFlow >= 0 ? 'low' : 'moderate';
  return {
    overall: levelFor(overallScore),
    score: Math.round(overallScore),
    factors: [
      {
        name: 'Pricing vs market',
        level: pricingLevel,
        weight: 0.4,
        explanation:
          pricePositionPct > 5
            ? `Priced ${pricePositionPct.toFixed(0)}% above comparable listings — limited margin of safety.`
            : pricePositionPct < -5
              ? `Priced ${Math.abs(pricePositionPct).toFixed(0)}% below comparables — favourable entry.`
              : 'Priced in line with comparable listings.',
      },
      {
        name: 'Cash flow',
        level: cashLevel,
        weight: 0.35,
        explanation:
          metrics.monthlyCashFlow >= 0
            ? 'Projected positive monthly cash flow under the base assumptions.'
            : 'Negative monthly cash flow under leverage; returns rely on appreciation.',
      },
      {
        name: 'Market & liquidity',
        level: 'moderate',
        weight: 0.25,
        explanation: 'Egyptian market: strong nominal appreciation but currency / rate volatility.',
      },
    ],
  };
}

/** Deterministic narrative summary from the numbers (used when the LLM is down). */
function fallbackSummary(
  property: Property,
  metrics: InvestmentMetrics,
  verdict: 'buy' | 'hold' | 'avoid',
  pricePositionPct: number,
  lang?: 'en' | 'ar',
): string {
  const pos = pricePositionPct >= 0 ? 'above' : 'below';
  const posAr = pricePositionPct >= 0 ? 'أعلى من' : 'أقل من';
  if (lang === 'ar') {
    return `هذا ${property.type} في ${property.address.city} مطروح بسعر ${property.price.toLocaleString()} ${property.currency} (${property.areaSqm} م²)، وهو ${posAr} متوسط المنطقة بنسبة ${Math.abs(pricePositionPct).toFixed(0)}%. بناءً على معدل رسملة ~${metrics.capRate.toFixed(1)}% وعائد متوقع لخمس سنوات ${metrics.fiveYearRoi.toFixed(0)}%، تشير الأرقام إلى توصية: ${verdict === 'buy' ? 'شراء' : verdict === 'hold' ? 'انتظار' : 'تجنّب'}.`;
  }
  return `This ${property.type} in ${property.address.city} is priced at ${property.price.toLocaleString()} ${property.currency} (${property.areaSqm} m²), ${pos} the area average by ${Math.abs(pricePositionPct).toFixed(0)}%. With an estimated ${metrics.capRate.toFixed(1)}% cap rate and a projected ${metrics.fiveYearRoi.toFixed(0)}% 5-year ROI, the data supports a "${verdict}" recommendation.`;
}

export async function generateReport(params: {
  property: Property;
  metrics: InvestmentMetrics;
  market: MarketContext;
  lang?: 'en' | 'ar';
}): Promise<GeneratedReport> {
  const { property, metrics, market, lang } = params;
  const context = [market.dataContext, market.retrieval.context].filter(Boolean).join('\n\n');

  // Deterministic verdict from real metrics + price-vs-comps (never the LLM's mood).
  const verdict = deriveRecommendation(metrics, market.pricePositionPct);

  // 1) Risk — LLM if available, else a grounded deterministic assessment.
  let risk: RiskAssessment;
  try {
    const riskPrompt = buildRiskAssessmentPrompt({ property, metrics, context });
    risk = await geminiClient.generateJSON<RiskAssessment>(riskPrompt.user, {
      system: riskPrompt.system,
      temperature: 0.2,
    });
  } catch (err) {
    logger.warn({ err }, 'Risk LLM unavailable — using deterministic fallback');
    risk = fallbackRisk(metrics, market.pricePositionPct, verdict.score);
  }

  // 2) Narrative — LLM if available, else a grounded template.
  let summary: string;
  try {
    const reportPrompt = buildInvestmentReportPrompt({
      property, metrics, risk, context, lang, verdict: verdict.recommendation,
    });
    const narrative = await geminiClient.generateJSON<NarrativeResponse>(reportPrompt.user, {
      system: reportPrompt.system,
      temperature: 0.4,
    });
    summary = narrative.summary;
  } catch (err) {
    logger.warn({ err }, 'Narrative LLM unavailable — using deterministic fallback');
    summary = fallbackSummary(property, metrics, verdict.recommendation, market.pricePositionPct, lang);
  }

  return {
    risk,
    summary,
    recommendation: verdict.recommendation,
    confidence: verdict.confidence,
  };
}
