// Property controller: search, getById, create.

import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/apiResponse.js';
import { propertyService } from '../services/property.service.js';
import type { PropertyFilters } from '../repositories/property.repository.js';

export const propertyController = {
  search: asyncHandler(async (req, res) => {
    const result = await propertyService.search(req.query as unknown as PropertyFilters);
    paginated(res, result);
  }),

  towns: asyncHandler(async (req, res) => {
    const city = typeof req.query.city === 'string' ? req.query.city : undefined;
    const towns = await propertyService.listTowns(city);
    ok(res, towns);
  }),

  getById: asyncHandler(async (req, res) => {
    const property = await propertyService.getById(req.params.id);
    ok(res, property);
  }),

  create: asyncHandler(async (req, res) => {
    const property = await propertyService.create(req.body);
    created(res, property);
  }),
};
