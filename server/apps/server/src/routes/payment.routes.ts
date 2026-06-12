// Payment / subscription routes.

import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const paymentRouter = Router();

paymentRouter.use(requireAuth);
paymentRouter.post('/subscribe', paymentController.subscribe);
paymentRouter.post('/checkout', paymentController.checkout);
paymentRouter.get('/confirm', paymentController.confirm);
