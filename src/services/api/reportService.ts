import { apiClient } from './apiClient';
import { propertyService } from './propertyService';
import { Property } from '../../types/listing';

export interface InvestmentMetrics {
  monthlyRent: number;
  monthlyExpenses: number;
  monthlyNetCashFlow: number;
  netRentalYield: number;
  fiveYearRoi: number;
  monthlyCashFlow: number;
}

export interface GeneratedReport {
  propertyId: string;
  title: string;
  recommendation: 'buy' | 'hold' | 'avoid';
  confidence: number;
  summary: string;
  metrics: InvestmentMetrics;
  risk: 'low' | 'moderate' | 'high';
  generatedAt: string;
}

function computeMetrics(property: Property): InvestmentMetrics {
  const monthlyRent = Math.round((property.price_egp || 0) * 0.06) / 12;
  const monthlyExpenses = Math.round(monthlyRent * 0.25);
  const monthlyNetCashFlow = monthlyRent - monthlyExpenses;
  const netRentalYield = monthlyNetCashFlow * 12 / (property.price_egp || 1) * 100;
  const fiveYearRoi = netRentalYield * 5 + (property.price_egp || 0) * 0.07 * 5 / (property.price_egp || 1) * 100;

  return {
    monthlyRent,
    monthlyExpenses,
    monthlyNetCashFlow,
    netRentalYield,
    fiveYearRoi,
    monthlyCashFlow: monthlyNetCashFlow,
  };
}

export const reportService = {
  async generate(propertyId: string): Promise<GeneratedReport> {
    try {
      const { data } = await apiClient.post<GeneratedReport>('/reports/generate', { propertyId });
      if (data?.metrics) return data;
    } catch {
      /* fall through to local computation */
    }

    const property = await propertyService.getById(propertyId);
    if (!property) throw new Error('Property not found');

    const metrics = computeMetrics(property);
    const recommendation = metrics.fiveYearRoi > 60 ? 'buy' : metrics.fiveYearRoi > 25 ? 'hold' : 'avoid';
    const confidence = Math.min(0.95, 0.5 + metrics.netRentalYield / 20);

    return {
      propertyId,
      title: property.title || 'Property',
      recommendation,
      confidence,
      summary:
        `This property projects a ${metrics.fiveYearRoi.toFixed(0)}% five-year ROI with a ` +
        `${metrics.netRentalYield.toFixed(1)}% net yield and ${
          metrics.monthlyCashFlow >= 0 ? 'positive' : 'negative'
        } monthly cash flow. ` +
        `Our model rates this a "${recommendation.toUpperCase()}".`,
      metrics,
      risk: metrics.netRentalYield > 8 ? 'low' : metrics.netRentalYield > 5 ? 'moderate' : 'high',
      generatedAt: new Date().toISOString(),
    };
  },
};