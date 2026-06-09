import { apiClient } from './apiClient';
import { env } from '../../config/env';

export type PaymentMethod = 'card' | 'vodafone' | 'fawry';

export interface Plan {
  id: string;
  name: string; // i18n key under payment
  price: number;
  features: string[]; // i18n keys
}

export const PLANS: Plan[] = [
  {
    id: 'institutional',
    name: 'planName',
    price: 499,
    features: ['feature1', 'feature2', 'feature3'],
  },
];

export const SERVICE_TAX_RATE = 0.14;

export interface CheckoutInput {
  planId: string;
  method: PaymentMethod;
  billing: { firstName: string; lastName: string; email?: string; phone: string };
}

export interface CheckoutResult {
  provider: 'paymob' | 'simulated';
  status: 'pending' | 'succeeded';
  reference: string;
  amountCents?: number;
  /** Paymob hosted page (card iframe / wallet redirect) to open in a browser. */
  paymentUrl?: string;
}

/** Luhn check for basic card-number validation. */
export function isValidCardNumber(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

export function formatCardNumber(raw: string): string {
  return raw
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

export function formatExpiry(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export const paymentService = {
  computeTotal(price: number): { subtotal: number; tax: number; total: number } {
    const tax = Math.round(price * SERVICE_TAX_RATE * 100) / 100;
    return { subtotal: price, tax, total: Math.round((price + tax) * 100) / 100 };
  },

  async checkout(input: CheckoutInput): Promise<CheckoutResult> {
    if (env.hasSupabase) {
      const { data } = await apiClient.post<CheckoutResult>('/payments/checkout', input);
      if (data) return data;
    }
    // Demo mode (no backend) → simulate an instant successful charge.
    await new Promise((r) => setTimeout(r, 1200));
    return { provider: 'simulated', status: 'succeeded', reference: `PP-${Date.now().toString(36).toUpperCase()}` };
  },

  async getStatus(reference: string): Promise<'pending' | 'succeeded' | 'failed'> {
    if (!env.hasSupabase) return 'succeeded';
    try {
      const { data } = await apiClient.get<{ status: 'pending' | 'succeeded' | 'failed' }>(
        `/payments/${reference}/status`,
      );
      return data?.status ?? 'pending';
    } catch {
      return 'pending';
    }
  },
};