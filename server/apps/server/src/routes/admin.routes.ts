// Admin routes — all guarded by requireAuth + requireAdmin.

import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createPropertySchema, updatePropertySchema } from '../validators/property.validator.js';
import { inquiryStatusSchema } from '../validators/inquiry.validator.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/users', adminController.listUsers);

adminRouter.post('/properties', validate(createPropertySchema), adminController.createProperty);
adminRouter.put('/properties/:id', validate(updatePropertySchema), adminController.updateProperty);
adminRouter.delete('/properties/:id', adminController.deleteProperty);

adminRouter.get('/inquiries', adminController.listInquiries);
adminRouter.put('/inquiries/:id/status', validate(inquiryStatusSchema), adminController.setInquiryStatus);
