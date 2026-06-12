// Prompt template for risk assessment reasoning. The LLM weighs market, financial and
// location factors and returns a structured RiskAssessment.

import type { Property, InvestmentMetrics } from '@propertypulse/shared-types';

export interface RiskAssessmentPromptInput {
  property: Property;
  metrics: InvestmentMetrics;
  context: string;
}

export interface RiskAssessmentPromptOutput {
  system: string;
  user: string;
}

export function buildRiskAssessmentPrompt(
  input: RiskAssessmentPromptInput,
): RiskAssessmentPromptOutput {
  const { property, metrics, context } = input;

  const system = [
    'You are a real-estate risk analyst.',
    'Assess investment risk across financial, market and location dimensions.',
    'Respond ONLY with JSON matching:',
    '{ "overall": "low"|"moderate"|"high", "score": number (0-100, higher = riskier),',
    '"factors": [ { "name": string, "level": "low"|"moderate"|"high", "weight": number (0-1), "explanation": string } ] }',
  ].join(' ');

  const user = `
PROPERTY: ${property.type} in ${property.address.city}, ${property.address.country}, priced at ${property.price} ${property.currency}.

KEY METRICS
- Net rental yield: ${metrics.netRentalYield.toFixed(2)}%
- Cap rate: ${metrics.capRate.toFixed(2)}%
- Monthly cash flow: ${metrics.monthlyCashFlow.toFixed(0)} ${property.currency}
- 5-year ROI: ${metrics.fiveYearRoi.toFixed(1)}%

CONTEXT
${context || 'No additional context retrieved.'}

Produce the risk assessment now. Include 3-5 factors covering cash flow, market, location and liquidity.`.trim();

  return { system, user };
}
