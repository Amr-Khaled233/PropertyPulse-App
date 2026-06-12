// Investment report routes (generate, fetch, list).

import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { aiLimiter } from '../middleware/rateLimit.middleware.js';
import { generateReportSchema } from '../validators/analysis.validator.js';

export const reportRouter = Router();

reportRouter.use(requireAuth);
reportRouter.post('/', aiLimiter, validate(generateReportSchema), reportController.generate);
reportRouter.get('/', reportController.list);
reportRouter.get('/:id', reportController.getById);
