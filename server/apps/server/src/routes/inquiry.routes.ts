// Public inquiry submission (contact / viewing request from a property page).

import { Router } from 'express';
import { inquiryController } from '../controllers/inquiry.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { createInquirySchema } from '../validators/inquiry.validator.js';

export const inquiryRouter = Router();

inquiryRouter.post('/', validate(createInquirySchema), inquiryController.create);
