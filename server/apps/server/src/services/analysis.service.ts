// Analysis service — on-demand metric computation and property comparison.

import type { Property, InvestmentMetrics, FinancialAssumptions } from '@propertypulse/shared-types';
import { deriveRecommendation, median, type Recommendation } from '@propertypulse/shared-utils';
import { propertyService } from './property.service.js';
import { propertyRepository } from '../repositories/property.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { usageRepository } from '../repositories/usage.repository.js';
import { calculateMetrics, type AssumptionOverrides } from '../ai/agents/calculationAgent.js';
import { geminiClient } from '../ai/llm/geminiClient.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

/** Free plan: how many AI comparisons per month. Paid plans are unlimited.
 *  Raised for development/demo so AI compare isn't blocked while testing. */
const FREE_COMPARE_LIMIT = 100;
function startOfMonthISO(): string {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1)).toISOString();
}
import {
  buildPropertyComparisonPrompt,
  type ComparisonCandidate,
} from '../ai/llm/prompts/propertyComparison.prompt.js';

export interface MetricsResult {
  assumptions: FinancialAssumptions;
  metrics: InvestmentMetrics;
}

export interface ComparisonCandidateOut {
  property: Property;
  metrics: InvestmentMetrics;
  recommendation: Recommendation;
  pricePerSqm: number;
  pricePositionPct: number;
}

export interface ComparisonResult {
  candidates: ComparisonCandidateOut[];
  ranking: { propertyId: string; rank: number; rationale: string }[];
  verdict: string;
}

export interface NegotiationResult {
  askingPrice: number;
  currency: string;
  fairValue: number;
  pricePerSqm: number;
  marketAvgPerSqm: number;
  deltaPct: number; // asking vs fair value
  suggestedOffer: number;
  compCount: number;
  tips: string[];
  summary: string;
}

export const analysisService = {
  /** Compute metrics for a stored property with optional assumption overrides. */
  async computeForProperty(propertyId: string, overrides: AssumptionOverrides = {}): Promise<MetricsResult> {
    const property = await propertyService.getById(propertyId);
    return calculateMetrics(property, overrides);
  },

  /** Compute metrics for an ad-hoc property payload (not stored). */
  computeForPayload(property: Property, overrides: AssumptionOverrides = {}): MetricsResult {
    return calculateMetrics(property, overrides);
  },

  /** Rank multiple stored properties using their computed metrics + the LLM.
   *  The deterministic metrics/recommendation always come back; the AI ranking
   *  is best-effort (skipped gracefully if the model is unavailable). */
  async compare(propertyIds: string[], lang?: 'en' | 'ar', userId?: string): Promise<ComparisonResult> {
    // Free plan: limit AI comparisons. Paid plans (pro/enterprise) are unlimited.
    if (userId) {
      const profile = await userRepository.getById(userId);
      if ((profile?.plan ?? 'free') === 'free') {
        const used = await usageRepository.countSince(userId, 'compare', startOfMonthISO());
        if (used >= FREE_COMPARE_LIMIT) {
          throw new ApiError(
            403,
            'COMPARE_LIMIT_REACHED',
            `Free plan includes ${FREE_COMPARE_LIMIT} AI comparison per month. Upgrade to Pro for unlimited comparisons.`,
          );
        }
      }
    }

    const candidates: ComparisonCandidate[] = [];
    for (const id of propertyIds) {
      const property = await propertyService.getById(id);
      const { metrics } = calculateMetrics(property);
      candidates.push({ property, metrics });
    }

    // Price each candidate against REAL comparables (same city & type) — exactly
    // like the single-property report does — so Compare and Report never
    // contradict each other (previously this used the mixed selected-set average,
    // which called a villa "overpriced" vs a cheaper apartment in the basket).
    const ppsm = candidates.map((c) => (c.property.areaSqm ? c.property.price / c.property.areaSqm : 0));
    const positions = await Promise.all(
      candidates.map(async (c, i) => {
        const comps = await propertyRepository.findComparables(
          { city: c.property.address.city, type: c.property.type, excludeId: c.property.id },
          10,
        );
        const avg = median(comps.map((x) => (x.areaSqm ? x.price / x.areaSqm : 0)));
        return avg ? ((ppsm[i] - avg) / avg) * 100 : 0;
      }),
    );

    const scored = candidates.map((c, i) => {
      const pricePositionPct = positions[i];
      const d = deriveRecommendation(c.metrics, pricePositionPct);
      return { c, i, pricePositionPct, score: d.score, recommendation: d.recommendation };
    });

    const out: ComparisonCandidateOut[] = scored.map((s) => ({
      property: s.c.property,
      metrics: s.c.metrics,
      recommendation: s.recommendation,
      pricePerSqm: Math.round(ppsm[s.i]),
      pricePositionPct: Math.round(s.pricePositionPct * 10) / 10,
    }));

    let ranking: ComparisonResult['ranking'] = [];
    let verdict = '';
    try {
      const prompt = buildPropertyComparisonPrompt(candidates, lang);
      const ai = await geminiClient.generateJSON<{ ranking: typeof ranking; verdict: string }>(prompt.user, {
        system: prompt.system,
        temperature: 0.3,
      });
      ranking = ai.ranking ?? [];
      verdict = ai.verdict ?? '';
    } catch (err) {
      logger.warn({ err }, 'AI comparison unavailable — using deterministic ranking');
    }

    // Always provide a ranking: fall back to the deterministic investment score.
    if (ranking.length === 0) {
      const ar = lang === 'ar';
      ranking = [...scored]
        .sort((a, b) => b.score - a.score)
        .map((s, idx) => ({
          propertyId: s.c.property.id,
          rank: idx + 1,
          rationale: ar
            ? `درجة استثمار ${s.score}/100 — ${s.pricePositionPct <= 0 ? `مسعّر أقل من السوق بنسبة ${Math.abs(s.pricePositionPct).toFixed(0)}%` : `مسعّر أعلى من السوق بنسبة ${s.pricePositionPct.toFixed(0)}%`}.`
            : `Investment score ${s.score}/100 — ${s.pricePositionPct <= 0 ? `priced ${Math.abs(s.pricePositionPct).toFixed(0)}% below market` : `priced ${s.pricePositionPct.toFixed(0)}% above market`}.`,
        }));
      if (!verdict) {
        const best = [...scored].sort((a, b) => b.score - a.score)[0];
        verdict = ar
          ? `أفضل خيار هو "${best.c.property.title}" بأعلى درجة استثمار وأفضل تسعير مقابل السوق.`
          : `The strongest pick is "${best.c.property.title}" — highest investment score and best price vs market.`;
      }
    }

    if (userId) await usageRepository.log(userId, 'compare').catch(() => {});
    return { candidates: out, ranking, verdict };
  },

  /** Suggest a fair value + negotiation offer for a property, grounded in real
   *  comparable listings (same city/type). AI tips are best-effort. */
  async negotiation(propertyId: string, lang?: 'en' | 'ar'): Promise<NegotiationResult> {
    const property = await propertyService.getById(propertyId);
    const comps = await propertyRepository.findComparables(
      { city: property.address.city, type: property.type, excludeId: property.id },
      20,
    );

    const ppsmList = comps.map((c) => (c.areaSqm ? c.price / c.areaSqm : 0)).filter((v) => v > 0);
    const marketAvgPerSqm = median(ppsmList);
    const pricePerSqm = property.areaSqm ? property.price / property.areaSqm : 0;

    const fairValue = marketAvgPerSqm && property.areaSqm
      ? Math.round(marketAvgPerSqm * property.areaSqm)
      : property.price;
    const deltaPct = fairValue ? ((property.price - fairValue) / fairValue) * 100 : 0;
    // Anchor below the lower of asking/fair value, leaving a negotiation margin.
    const suggestedOffer = Math.round(Math.min(property.price, fairValue) * 0.96);

    // Deterministic tips (always available), localized.
    const ar = lang === 'ar';
    const tips: string[] = [];
    if (deltaPct > 5) {
      tips.push(ar
        ? `العقار مسعّر أعلى من متوسط السوق بـ ${deltaPct.toFixed(0)}% — استخدم ده كورقة تفاوض قوية.`
        : `Priced ${deltaPct.toFixed(0)}% above the area average — use this as strong leverage.`);
    } else if (deltaPct < -5) {
      tips.push(ar
        ? `مسعّر أقل من السوق بـ ${Math.abs(deltaPct).toFixed(0)}% — فرصة جيدة، تحرّك بسرعة قبل ما يتباع.`
        : `Priced ${Math.abs(deltaPct).toFixed(0)}% below market — a good deal; move quickly.`);
    } else {
      tips.push(ar ? 'السعر قريب من قيمة السوق العادلة.' : 'Priced close to fair market value.');
    }
    tips.push(ar
      ? `قيمة السوق العادلة المقدّرة ≈ ${fairValue.toLocaleString()} ${property.currency} (من ${comps.length} عقار مشابه).`
      : `Estimated fair value ≈ ${fairValue.toLocaleString()} ${property.currency} (from ${comps.length} comparables).`);
    tips.push(ar
      ? 'اطلب الدفع كاش أو دفعة مقدمة أكبر مقابل خصم إضافي 3-5%.'
      : 'Offer cash or a larger down payment in exchange for an extra 3–5% discount.');

    // Optional AI narrative summary (graceful).
    let summary = '';
    try {
      const sys = ar
        ? 'أنت مستشار عقاري. اكتب جملة أو جملتين بالعربية تنصح المشتري بخصوص التفاوض على هذا العقار بناءً على الأرقام. كن محددًا وعمليًا.'
        : 'You are a real-estate advisor. In 1–2 sentences, advise the buyer on negotiating this property based on the numbers. Be concrete and practical.';
      const user = `Asking: ${property.price} ${property.currency}. Fair value: ${fairValue}. ${deltaPct >= 0 ? 'Above' : 'Below'} market by ${Math.abs(deltaPct).toFixed(0)}%. Suggested offer: ${suggestedOffer}.`;
      summary = await geminiClient.generate(user, { system: sys, temperature: 0.4 });
    } catch (err) {
      logger.warn({ err }, 'Negotiation AI summary unavailable');
    }

    return {
      askingPrice: property.price,
      currency: property.currency,
      fairValue,
      pricePerSqm: Math.round(pricePerSqm),
      marketAvgPerSqm: Math.round(marketAvgPerSqm),
      deltaPct: Math.round(deltaPct * 10) / 10,
      suggestedOffer,
      compCount: comps.length,
      tips,
      summary,
    };
  },
};
