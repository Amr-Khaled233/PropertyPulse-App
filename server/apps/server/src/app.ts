// Express application factory — wires middleware and routes.

import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { httpLogger } from './middleware/logger.middleware.js';
import { apiLimiter } from './middleware/rateLimit.middleware.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '1mb' }));
  app.use(httpLogger);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', apiLimiter, apiRouter);

  app.use(errorMiddleware);
  return app;
}
