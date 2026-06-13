// Report service — runs the agent pipeline and persists the resulting report.

import type { InvestmentReport } from '@propertypulse/shared-types';
import { propertyService } from './property.service.js';
import { runAnalysisPipeline } from '../ai/agents/orchestrator.js';
import { reportRepository } from '../repositories/report.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { ApiError } from '../utils/apiError.js';
import type { AssumptionOverrides } from '../ai/agents/calculationAgent.js';

/** Free plan allowance — paid plans (pro/enterprise) are unlimited. */
const FREE_MONTHLY_REPORTS = 2;

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export const reportService = {
  async generate(input: {
    userId: string;
    propertyId: string;
    assumptions?: AssumptionOverrides;
    lang?: 'en' | 'ar';
  }): Promise<InvestmentReport> {
    // Enforce the free-plan monthly report quota before doing any AI work.
    const profile = await userRepository.getById(input.userId);
    const plan = profile?.plan ?? 'free';
    if (plan === 'free') {
      const used = await reportRepository.countSince(input.userId, startOfMonthISO());
      if (used >= FREE_MONTHLY_REPORTS) {
        throw new ApiError(
          403,
          'REPORT_LIMIT_REACHED',
          `Free plan is limited to ${FREE_MONTHLY_REPORTS} AI reports per month. Upgrade to Pro for unlimited reports.`,
        );
      }
    }

    const property = await propertyService.getById(input.propertyId);

    const result = await runAnalysisPipeline({
      property,
      userId: input.userId,
      assumptions: input.assumptions,
      lang: input.lang,
    });

    // `assumptions` is part of the pipeline output but not stored on the report row.
    const { assumptions: _assumptions, ...report } = result;
    return reportRepository.create(report);
  },

  async getById(id: string, userId: string): Promise<InvestmentReport> {
    const report = await reportRepository.getById(id);
    if (!report) throw ApiError.notFound('Report not found');
    if (report.userId !== userId) throw ApiError.unauthorized('Not your report');
    return report;
  },

  listForUser(userId: string): Promise<InvestmentReport[]> {
    return reportRepository.listForUser(userId);
  },
};
