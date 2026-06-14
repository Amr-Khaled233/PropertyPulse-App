// Prompt template for comparing multiple properties and ranking them for an investor.

import type { Property, InvestmentMetrics } from '@propertypulse/shared-types';

export interface ComparisonCandidate {
  property: Property;
  metrics: InvestmentMetrics;
}

export interface PropertyComparisonPromptOutput {
  system: string;
  user: string;
}

export function buildPropertyComparisonPrompt(
  candidates: ComparisonCandidate[],
  lang?: 'en' | 'ar',
): PropertyComparisonPromptOutput {
  const isAr = lang === 'ar';

  const system = [
    'You are a senior real-estate investment advisor comparing properties in the Cairo & Giza market.',
    'Rank them from best to worst investment.',
    'For EACH property write a "rationale" that covers ALL of the following points as separate sentences:',
    '1. Rental yield quality (state the % and whether it is strong/average/weak for the market).',
    '2. 5-year ROI outlook (state the % and what it means for the investor).',
    '3. Monthly cash flow (positive or negative, and what that implies).',
    '4. Pricing vs market (is it over/under/fairly priced and by how much).',
    '5. Cap rate assessment (state the % and compare to a typical 6-8% benchmark).',
    '6. One key strength AND one key weakness or risk specific to this property.',
    'The rationale must be 5-7 sentences minimum. Do NOT write just a score.',
    isAr
      ? 'Write every "rationale" and the "verdict" in Arabic (keep propertyId values unchanged).'
      : 'Write the rationale and verdict in English.',
    'Respond ONLY with valid JSON:',
    '{ "ranking": [ { "propertyId": string, "rank": number, "rationale": string } ], "verdict": string }',
  ].join(' ');

  const rows = candidates
    .map(
      ({ property, metrics }) =>
        `- id=${property.id} | type=${property.type} | city=${property.address.city} | price=${property.price} ${property.currency} | areaSqm=${property.areaSqm} | bedrooms=${property.bedrooms} | netYield=${metrics.netRentalYield.toFixed(2)}% | capRate=${metrics.capRate.toFixed(2)}% | 5yrROI=${metrics.fiveYearRoi.toFixed(1)}% | cashOnCash=${metrics.cashOnCashReturn.toFixed(2)}% | monthlyCashFlow=${metrics.monthlyCashFlow.toFixed(0)} ${property.currency}`,
    )
    .join('\n');

  const user = [
    `Compare and rank these ${candidates.length} properties for an investor:`,
    rows,
    'Remember: each rationale must cover yield, ROI, cash flow, pricing, cap rate, and at least one strength and one risk. Minimum 5 sentences per property.',
  ].join('\n');

  return { system, user };
}
