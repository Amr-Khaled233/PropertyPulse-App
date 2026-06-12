// Investment analysis routes (compute metrics, compare properties).

import { Router } from 'express';
import { analysisController } from '../controllers/analysis.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rateLimit.middleware.js';
import { computeMetricsSchema, compareSchema, negotiationSchema } from '../validators/analysis.validator.js';

export const analysisRouter = Router();

analysisRouter.post('/metrics', validate(computeMetricsSchema), analysisController.computeMetrics);
// Compare is auth-gated so the free-plan quota can be enforced per user.
analysisRouter.post('/compare', requireAuth, aiLimiter, validate(compareSchema), analysisController.compare);
analysisRouter.post('/negotiation', aiLimiter, validate(negotiationSchema), analysisController.negotiation);
