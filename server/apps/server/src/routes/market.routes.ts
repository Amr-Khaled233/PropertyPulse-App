// Market analytics routes (public live overview).

import { Router } from 'express';
import { marketController } from '../controllers/market.controller.js';

export const marketRouter = Router();

marketRouter.get('/overview', marketController.overview);
