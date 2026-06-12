// Builds a live data context for the AI advisor chat, so answers are grounded
// in the actual PropertyPulse dataset (Cairo & Giza listings + market stats)
// instead of refusing with "no context".

import { propertyService } from '../services/property.service.js';
import { propertyRepository, marketRepository } from '../repositories/property.repository.js';
import { formatCurrency } from '@propertypulse/shared-utils';

function yieldFromTrend(trend: { medianPrice: number; medianRent: number }[]): string {
  if (!trend.length) return 'n/a';
  const last = trend[trend.length - 1];
  const first = trend[0];
  const grossYield = last.medianPrice ? ((last.medianRent * 12) / last.medianPrice) * 100 : 0;
  const priceChange = first.medianPrice ? ((last.medianPrice - first.medianPrice) / first.medianPrice) * 100 : 0;
  return `~${grossYield.toFixed(1)}% gross rental yield; median price ${priceChange >= 0 ? 'up' : 'down'} ${Math.abs(priceChange).toFixed(1)}% over the tracked period`;
}

export async function buildMarketContext(): Promise<string> {
  const [sample, cairo, giza, towns, cairoTrend, gizaTrend] = await Promise.all([
    propertyService.search({ pageSize: 8 }),
    propertyService.search({ city: 'Cairo', pageSize: 1 }),
    propertyService.search({ city: 'Giza', pageSize: 1 }),
    propertyRepository.listTowns(),
    marketRepository.getTrends('Cairo'),
    marketRepository.getTrends('Giza'),
  ]);

  const prices = sample.items.map((p) => p.price).filter(Boolean);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;

  const listingLines = sample.items
    .map(
      (p) =>
        `- ${p.title} | ${p.type} | ${formatCurrency(p.price, p.currency)} | ${p.areaSqm} m² | ${[p.address.state, p.address.city].filter(Boolean).join(', ')}`,
    )
    .join('\n');

  return [
    `DATASET OVERVIEW`,
    `Total active listings: ${sample.total.toLocaleString()} (Cairo: ${cairo.total.toLocaleString()}, Giza: ${giza.total.toLocaleString()}).`,
    `Areas covered (${towns.length}): ${towns.slice(0, 18).join(', ')}${towns.length > 18 ? ', …' : ''}.`,
    `Sample asking-price range: ${formatCurrency(min, 'EGP')} – ${formatCurrency(max, 'EGP')}.`,
    ``,
    `MARKET TRENDS`,
    `Cairo: ${yieldFromTrend(cairoTrend)}.`,
    `Giza: ${yieldFromTrend(gizaTrend)}.`,
    ``,
    `SAMPLE LISTINGS`,
    listingLines || '(none)',
  ].join('\n');
}
