// Payment controller: Stripe Checkout (create + confirm) and direct subscribe.

import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { paymentService } from '../services/payment.service.js';

export const paymentController = {
  /** POST /payments/subscribe  { plan } — direct upgrade (free / simulated). */
  subscribe: asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    ok(res, await paymentService.subscribe(req.user.id, req.body.plan));
  }),

  /** POST /payments/checkout  { plan } — start a Stripe Checkout Session. */
  checkout: asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    ok(res, await paymentService.createCheckout(req.user.id, req.body.plan));
  }),

  /** GET /payments/confirm?session_id=... — verify payment and apply the plan. */
  confirm: asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const sessionId = String(req.query.session_id ?? '');
    if (!sessionId) throw ApiError.badRequest('session_id is required');
    ok(res, await paymentService.confirmCheckout(req.user.id, sessionId));
  }),
};
