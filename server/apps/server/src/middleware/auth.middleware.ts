// Auth guard — verifies the Supabase access token from the Authorization header
// and attaches the authenticated user to req.user.

import type { RequestHandler } from 'express';
import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth: RequestHandler = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing bearer token');
  }

  const token = header.slice('Bearer '.length);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  const meta = (data.user.user_metadata ?? {}) as { full_name?: string; name?: string };
  req.user = {
    id: data.user.id,
    email: data.user.email,
    fullName: meta.full_name ?? meta.name,
  };
  next();
});
