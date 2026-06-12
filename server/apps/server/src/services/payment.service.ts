// Payment service — Stripe Checkout (test mode) with a simulated fallback.
// Real flow: create a Checkout Session → user pays on Stripe → we verify the
// session is paid → upgrade the plan. If no STRIPE_SECRET_KEY is set, we skip
// Stripe and upgrade directly (demo mode).

import { userRepository } from '../repositories/user.repository.js';
import { ApiError } from '../utils/apiError.js';
import { stripe } from '../config/stripe.js';
import { env } from '../config/env.js';
import type { PlanTier } from '@propertypulse/shared-types';

const VALID_PLANS: PlanTier[] = ['free', 'pro', 'enterprise'];

// Monthly price per plan, in EGP. Free has no charge.
const PLAN_PRICE_EGP: Record<PlanTier, number> = { free: 0, pro: 850, enterprise: 2400 };
const PLAN_NAME: Record<PlanTier, string> = {
  free: 'PropertyPulse Free',
  pro: 'PropertyPulse Pro',
  enterprise: 'PropertyPulse Enterprise',
};

export interface SubscribeResult {
  ok: boolean;
  plan: PlanTier;
  transactionId: string;
  paidAt: string;
}

function assertPlan(plan: PlanTier): void {
  if (!VALID_PLANS.includes(plan)) throw ApiError.badRequest('Invalid plan');
}

export const paymentService = {
  /** Directly upgrade (simulated gateway / free plan). */
  async subscribe(userId: string, plan: PlanTier): Promise<SubscribeResult> {
    assertPlan(plan);
    const profile = await userRepository.setPlan(userId, plan);
    return {
      ok: true,
      plan: profile.plan ?? plan,
      transactionId: `txn_${Date.now().toString(36)}`,
      paidAt: new Date().toISOString(),
    };
  },

  /** Create a Stripe Checkout Session and return its URL (or signal fallback). */
  async createCheckout(userId: string, plan: PlanTier): Promise<{ url: string | null; simulated: boolean }> {
    assertPlan(plan);
    const amount = PLAN_PRICE_EGP[plan];
    // Free plan or no Stripe configured → simulate (caller upgrades directly).
    if (plan === 'free' || amount <= 0 || !stripe) {
      return { url: null, simulated: true };
    }

    const base = env.CORS_ORIGIN;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'egp',
            unit_amount: amount * 100, // piasters
            product_data: { name: `${PLAN_NAME[plan]} (monthly)` },
          },
        },
      ],
      metadata: { userId, plan },
      success_url: `${base}/pricing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/pricing?canceled=1`,
    });
    return { url: session.url, simulated: false };
  },

  /** Verify a completed Checkout Session and apply the plan to the user. */
  async confirmCheckout(userId: string, sessionId: string): Promise<SubscribeResult> {
    if (!stripe) throw ApiError.badRequest('Stripe is not configured');
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.userId !== userId) throw ApiError.unauthorized('Session does not belong to user');
    if (session.payment_status !== 'paid') throw ApiError.badRequest('Payment not completed');

    const plan = (session.metadata?.plan ?? 'pro') as PlanTier;
    assertPlan(plan);
    const profile = await userRepository.setPlan(userId, plan);
    return {
      ok: true,
      plan: profile.plan ?? plan,
      transactionId: typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
      paidAt: new Date().toISOString(),
    };
  },
};
