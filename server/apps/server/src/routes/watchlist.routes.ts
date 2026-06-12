// Watchlist routes (add, remove, list saved properties, alerts).

import { Router } from 'express';
import { watchlistController } from '../controllers/watchlist.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const watchlistRouter = Router();

watchlistRouter.use(requireAuth);
watchlistRouter.get('/', watchlistController.list);
watchlistRouter.post('/', watchlistController.add);
watchlistRouter.delete('/:id', watchlistController.remove);
watchlistRouter.get('/alerts', watchlistController.alerts);
