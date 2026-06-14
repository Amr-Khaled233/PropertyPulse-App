// Public inquiry submission (contact / viewing request from a property page).

import { Router } from 'express';
import { inquiryController } from '../controllers/inquiry.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createInquirySchema } from '../validators/inquiry.validator.js';

export const inquiryRouter = Router();

inquiryRouter.get('/my', requireAuth, inquiryController.myInquiries);
inquiryRouter.post('/', validate(createInquirySchema), inquiryController.create);
