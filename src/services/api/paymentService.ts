// Payments / subscriptions (Stripe test mode) — consumes the backend.
//   POST /payments/checkout  { plan }        → { url, simulated }  (open w/ WebBrowser)
//   GET  /payments/confirm?session_id=...     → SubscribeResult
//   POST /payments/subscribe { plan, ... }    → SubscribeResult

import { apiClient } from './apiClient';

export type PlanId = 'free' | 'pro' | 'enterprise';

export interface SubscribeInput {
  plan: PlanId;
  amount: number;
  currency: string;
  cardName?: string;
  method?: 'card' | 'vodafone' | 'fawry';
}

export interface SubscribeResult {
  ok: boolean;
  plan: PlanId;
  transactionId: string;
  paidAt: string;
}

export const paymentService = {
  /** Start a Stripe Checkout Session. Returns a redirect URL, or simulated=true
   *  when Stripe isn't configured (caller then upgrades directly). */
  async startCheckout(plan: PlanId): Promise<{ url: string | null; simulated: boolean }> {
    const { data } = await apiClient.post<{ url: string | null; simulated: boolean }>('/payments/checkout', { plan });
    return data;
  },

  /** Verify a returned Stripe Checkout session and apply the plan. */
  async confirm(sessionId: string): Promise<SubscribeResult> {
    const { data } = await apiClient.get<SubscribeResult>('/payments/confirm', { session_id: sessionId });
    return data;
  },

  async subscribe(input: SubscribeInput): Promise<SubscribeResult> {
    const { data } = await apiClient.post<SubscribeResult>('/payments/subscribe', input);
    return data;
  },
};
