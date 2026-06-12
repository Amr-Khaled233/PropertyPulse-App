// Watchlist controller: add, remove, list, alerts.

import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { watchlistService } from '../services/watchlist.service.js';

export const watchlistController = {
  list: asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    ok(res, await watchlistService.list(req.user.id));
  }),

  add: asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const item = await watchlistService.add({
      userId: req.user.id,
      propertyId: req.body.propertyId,
      notes: req.body.notes,
      notifyOnChange: req.body.notifyOnChange,
    });
    created(res, item);
  }),

  remove: asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    await watchlistService.remove(req.user.id, req.params.id);
    ok(res, { removed: true });
  }),

  alerts: asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    ok(res, await watchlistService.listAlerts(req.user.id));
  }),
};
