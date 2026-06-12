// Centralized error handler — converts thrown errors into ApiResponse envelopes.

import type { ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }
  logger.error(err);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
};
