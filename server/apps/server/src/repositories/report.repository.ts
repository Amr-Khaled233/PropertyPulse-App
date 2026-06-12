// Report repository — persist and query investment_reports.

import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/apiError.js';
import { toReport, toReportInsert, type ReportRow } from '../models/report.model.js';
import type { InvestmentReport } from '@propertypulse/shared-types';

export const reportRepository = {
  async create(report: Omit<InvestmentReport, 'id' | 'generatedAt'>): Promise<InvestmentReport> {
    const { data, error } = await supabase
      .from('investment_reports')
      .insert(toReportInsert(report))
      .select('*')
      .single();
    if (error) throw new ApiError(500, 'REPORT_CREATE_FAILED', error.message);
    return toReport(data as ReportRow);
  },

  async getById(id: string): Promise<InvestmentReport | null> {
    const { data, error } = await supabase
      .from('investment_reports')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new ApiError(500, 'REPORT_FETCH_FAILED', error.message);
    return data ? toReport(data as ReportRow) : null;
  },

  /** Count a user's reports generated on/after the given ISO timestamp. */
  async countSince(userId: string, sinceISO: string): Promise<number> {
    const { count, error } = await supabase
      .from('investment_reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('generated_at', sinceISO);
    if (error) throw new ApiError(500, 'REPORT_COUNT_FAILED', error.message);
    return count ?? 0;
  },

  async listForUser(userId: string): Promise<InvestmentReport[]> {
    const { data, error } = await supabase
      .from('investment_reports')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false });
    if (error) throw new ApiError(500, 'REPORT_LIST_FAILED', error.message);
    return (data as ReportRow[]).map(toReport);
  },
};
