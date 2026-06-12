// Market controller: live market overview computed from the properties table.

import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import { marketRepository } from '../repositories/property.repository.js';

export const marketController = {
  overview: asyncHandler(async (_req, res) => {
    ok(res, await marketRepository.overview());
  }),
};
