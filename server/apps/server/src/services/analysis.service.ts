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

/** Free plan: how many AI comparisons per month. Paid plans are unlimited. */
const FREE_COMPARE_LIMIT = 1;
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

    // Always provide a ranking: fall back to deterministic analysis when AI is unavailable.
    if (ranking.length === 0) {
      const ar = lang === 'ar';
      ranking = [...scored]
        .sort((a, b) => b.score - a.score)
        .map((s, idx) => {
          const m = s.c.metrics;
          const pp = s.pricePositionPct;
          const lines: string[] = [];

          if (ar) {
            // Yield
            const yieldLabel = m.netRentalYield >= 8 ? 'ممتازة' : m.netRentalYield >= 5 ? 'جيدة' : 'ضعيفة';
            lines.push(`العائد الإيجاري الصافي ${m.netRentalYield.toFixed(2)}% — ${yieldLabel} مقارنةً بمعيار السوق (5-8%).`);
            // ROI
            const roiLabel = m.fiveYearRoi >= 40 ? 'نمو رأسمالي قوي' : m.fiveYearRoi >= 20 ? 'نمو معقول' : 'نمو محدود';
            lines.push(`العائد على مدى 5 سنوات ${m.fiveYearRoi.toFixed(1)}% — يشير إلى ${roiLabel} على المدى المتوسط.`);
            // Cash flow
            lines.push(m.monthlyCashFlow >= 0
              ? `التدفق النقدي الشهري إيجابي بقيمة ${m.monthlyCashFlow.toFixed(0)} — يغطي التشغيل ويولّد دخلاً فورياً.`
              : `التدفق النقدي الشهري سلبي بقيمة ${Math.abs(m.monthlyCashFlow).toFixed(0)} — يتطلب دعماً مالياً جزئياً شهرياً.`);
            // Pricing
            lines.push(pp <= -5
              ? `مسعّر أقل من السوق بنسبة ${Math.abs(pp).toFixed(0)}% — يمثّل فرصة شراء جيدة مقارنةً بالعقارات المماثلة.`
              : pp >= 5
              ? `مسعّر أعلى من السوق بنسبة ${pp.toFixed(0)}% — يستدعي التفاوض على السعر قبل الشراء.`
              : `التسعير قريب من القيمة السوقية العادلة بفارق ${Math.abs(pp).toFixed(0)}%.`);
            // Cap rate
            const capLabel = m.capRate >= 8 ? 'مرتفع ومناسب للاستثمار' : m.capRate >= 5 ? 'معقول' : 'منخفض نسبياً';
            lines.push(`معدل الرسملة ${m.capRate.toFixed(2)}% — ${capLabel} وفق المعايير الإقليمية.`);
            // Cash on cash
            lines.push(`العائد النقدي على النقد ${m.cashOnCashReturn.toFixed(2)}% — يعكس كفاءة استخدام رأس المال المستثمر.`);
            // Score
            lines.push(`درجة الاستثمار الإجمالية: ${s.score}/100.`);
          } else {
            // Yield
            const yieldLabel = m.netRentalYield >= 8 ? 'strong' : m.netRentalYield >= 5 ? 'moderate' : 'below average';
            lines.push(`Net rental yield is ${m.netRentalYield.toFixed(2)}% — ${yieldLabel} relative to the typical 5–8% market benchmark.`);
            // ROI
            const roiLabel = m.fiveYearRoi >= 40 ? 'strong capital growth' : m.fiveYearRoi >= 20 ? 'moderate appreciation' : 'limited upside';
            lines.push(`5-year ROI of ${m.fiveYearRoi.toFixed(1)}% indicates ${roiLabel} over the medium term.`);
            // Cash flow
            lines.push(m.monthlyCashFlow >= 0
              ? `Monthly cash flow is positive at ${m.monthlyCashFlow.toFixed(0)} EGP — covers operating costs and generates immediate income.`
              : `Monthly cash flow is negative at ${Math.abs(m.monthlyCashFlow).toFixed(0)} EGP — requires partial out-of-pocket support each month.`);
            // Pricing
            lines.push(pp <= -5
              ? `Priced ${Math.abs(pp).toFixed(0)}% below comparable market listings — represents good value and buying opportunity.`
              : pp >= 5
              ? `Priced ${pp.toFixed(0)}% above market comparables — price negotiation is recommended before committing.`
              : `Priced within ${Math.abs(pp).toFixed(0)}% of fair market value — reasonably in line with the area.`);
            // Cap rate
            const capLabel = m.capRate >= 8 ? 'high and investment-grade' : m.capRate >= 5 ? 'acceptable' : 'on the lower side';
            lines.push(`Cap rate of ${m.capRate.toFixed(2)}% is ${capLabel} against a typical 6–8% regional target.`);
            // Cash on cash
            lines.push(`Cash-on-cash return of ${m.cashOnCashReturn.toFixed(2)}% reflects the efficiency of the invested equity.`);
            // Score
            lines.push(`Overall investment score: ${s.score}/100.`);
          }

          return {
            propertyId: s.c.property.id,
            rank: idx + 1,
            rationale: lines.join('\n'),
          };
        });

      if (!verdict) {
        const best = [...scored].sort((a, b) => b.score - a.score)[0];
        verdict = lang === 'ar'
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
