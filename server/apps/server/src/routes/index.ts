// Root API router — mounts all feature routers under /api.

import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { propertyRouter } from './property.routes.js';
import { analysisRouter } from './analysis.routes.js';
import { reportRouter } from './report.routes.js';
import { watchlistRouter } from './watchlist.routes.js';
import { chatRouter } from './chat.routes.js';
import { paymentRouter } from './payment.routes.js';
import { adminRouter } from './admin.routes.js';
import { inquiryRouter } from './inquiry.routes.js';
import { marketRouter } from './market.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/properties', propertyRouter);
apiRouter.use('/analysis', analysisRouter);
apiRouter.use('/reports', reportRouter);
apiRouter.use('/watchlist', watchlistRouter);
apiRouter.use('/chat', chatRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/inquiries', inquiryRouter);
apiRouter.use('/market', marketRouter);
