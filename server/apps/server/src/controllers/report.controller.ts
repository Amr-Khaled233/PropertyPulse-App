// Report controller: generate, getById, listForUser.

import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { reportService } from '../services/report.service.js';

export const reportController = {
  generate: asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const report = await reportService.generate({
      userId: req.user.id,
      propertyId: req.body.propertyId,
      assumptions: req.body.assumptions,
      lang: req.body.lang,
    });
    created(res, report);
  }),

  getById: asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const report = await reportService.getById(req.params.id, req.user.id);
    ok(res, report);
  }),

  list: asyncHandler(async (req, res) => {
    if (!req.user) throw ApiError.unauthorized();
    const reports = await reportService.listForUser(req.user.id);
    ok(res, reports);
  }),
};
