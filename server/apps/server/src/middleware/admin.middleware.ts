// Admin guard — runs after requireAuth and ensures the user has the admin role.

import type { RequestHandler } from 'express';
import { userRepository } from '../repositories/user.repository.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAdmin: RequestHandler = asyncHandler(async (req, _res, next) => {
  const userId = req.user?.id;
  if (!userId) throw ApiError.unauthorized('Authentication required');

  const profile = await userRepository.getById(userId);
  if (profile?.role !== 'admin') {
    throw new ApiError(403, 'FORBIDDEN', 'Admin access required');
  }
  next();
});
