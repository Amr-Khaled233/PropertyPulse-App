// Saved comparisons routes — all require auth.

import { Router } from 'express';
import { comparisonController } from '../controllers/comparison.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const comparisonRouter = Router();

comparisonRouter.use(requireAuth);
comparisonRouter.get('/', comparisonController.list);
comparisonRouter.post('/', comparisonController.create);
comparisonRouter.delete('/:id', comparisonController.remove);
