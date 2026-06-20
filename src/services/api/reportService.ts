// AI investment reports — consumes the backend (multi-agent + Gemini).
//   POST /reports { propertyId, assumptions, lang }   (Bearer) → generate
//   GET  /reports                                     (Bearer) → list
//   GET  /reports/:id                                 (Bearer) → one

import { apiClient } from './apiClient';
import type { InvestmentReport } from '../../types/report';
import type { FinancialAssumptions } from '../../types/analysis';

export const reportService = {
  async generate(
    propertyId: string,
    assumptions: Partial<FinancialAssumptions> = {},
    lang: 'en' | 'ar' = 'en',
  ): Promise<InvestmentReport> {
    const { data } = await apiClient.post<InvestmentReport>('/reports', { propertyId, assumptions, lang }, 90_000);
    return data;
  },

  async list(): Promise<InvestmentReport[]> {
    const { data } = await apiClient.get<InvestmentReport[]>('/reports');
    return data;
  },

  async getById(id: string): Promise<InvestmentReport> {
    const { data } = await apiClient.get<InvestmentReport>(`/reports/${id}`);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/reports/${id}`);
  },
};
