// Saved comparisons controller — list / save / delete the user's comparisons.

import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { comparisonService } from '../services/comparison.service.js';

export const comparisonController = {
  list: asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    ok(res, await comparisonService.list(req.user.id));
  }),

  create: asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const { propertyIds, result } = req.body;
    if (!Array.isArray(propertyIds) || result == null) {
      throw ApiError.badRequest('propertyIds[] and result are required');
    }
    created(res, await comparisonService.save(req.user.id, propertyIds, result));
  }),

  remove: asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    await comparisonService.remove(req.user.id, req.params.id);
    ok(res, { id: req.params.id, deleted: true });
  }),
};
