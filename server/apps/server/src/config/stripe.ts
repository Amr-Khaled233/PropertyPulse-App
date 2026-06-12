// Stripe client — only initialised when STRIPE_SECRET_KEY is configured.
// When absent, payments fall back to the simulated gateway so the app still runs.

import Stripe from 'stripe';
import { env } from './env.js';

export const stripe: Stripe | null = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

export const stripeEnabled = stripe !== null;
