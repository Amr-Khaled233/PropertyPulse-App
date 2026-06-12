// Natural-language Q&A routes (RAG-backed chat).

import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { aiLimiter } from '../middleware/rateLimit.middleware.js';
import { askSchema } from '../validators/analysis.validator.js';

export const chatRouter = Router();

chatRouter.post('/', aiLimiter, validate(askSchema), chatController.ask);
