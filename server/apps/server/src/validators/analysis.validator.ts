// Zod schemas for analysis/assumptions and report requests.

import { z } from 'zod';

export const assumptionsSchema = z
  .object({
    purchasePrice: z.number().positive().optional(),
    downPaymentPct: z.number().min(0).max(100).optional(),
    loanInterestRate: z.number().min(0).max(100).optional(),
    loanTermYears: z.number().int().positive().optional(),
    monthlyRent: z.number().nonnegative().optional(),
    vacancyRatePct: z.number().min(0).max(100).optional(),
    monthlyExpenses: z.number().nonnegative().optional(),
    annualAppreciationPct: z.number().min(-50).max(100).optional(),
    closingCosts: z.number().nonnegative().optional(),
  })
  .optional();

export const computeMetricsSchema = z.object({
  propertyId: z.string().uuid().optional(),
  assumptions: assumptionsSchema,
});

export const compareSchema = z.object({
  propertyIds: z.array(z.string().uuid()).min(2).max(4),
  lang: z.enum(['en', 'ar']).optional(),
});

export const negotiationSchema = z.object({
  propertyId: z.string().uuid(),
  lang: z.enum(['en', 'ar']).optional(),
});

export const generateReportSchema = z.object({
  propertyId: z.string().uuid(),
  assumptions: assumptionsSchema,
  lang: z.enum(['en', 'ar']).optional(),
});

export const askSchema = z.object({
  question: z.string().min(1),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant', 'system']), content: z.string() }))
    .optional(),
  lang: z.enum(['en', 'ar']).optional(),
});
