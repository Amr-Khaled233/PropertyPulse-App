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
  const system = [
    'You are a real-estate investment advisor comparing candidate properties in the Cairo & Giza market.',
    'Rank them from best to worst investment and justify briefly using the metrics (yields, ROI, price).',
    lang === 'ar'
      ? 'Write every "rationale" and the "verdict" in Arabic (keep propertyId values unchanged).'
      : 'Write the rationale and verdict in English.',
    'Respond ONLY with JSON matching:',
    '{ "ranking": [ { "propertyId": string, "rank": number, "rationale": string } ], "verdict": string }',
  ].join(' ');

  const rows = candidates
    .map(
      ({ property, metrics }) =>
        `- id=${property.id} | ${property.type} in ${property.address.city} | price=${property.price} ${property.currency} | netYield=${metrics.netRentalYield.toFixed(2)}% | capRate=${metrics.capRate.toFixed(2)}% | 5yrROI=${metrics.fiveYearRoi.toFixed(1)}% | cashFlow=${metrics.monthlyCashFlow.toFixed(0)}`,
    )
    .join('\n');

  const user = `Compare and rank these ${candidates.length} properties:\n${rows}`;

  return { system, user };
}
