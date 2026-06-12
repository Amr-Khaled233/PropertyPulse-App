// Zod validation middleware factory (body/query/params).
// On success it replaces the request segment with the parsed/coerced data.

import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { ApiError } from '../utils/apiError.js';

type Source = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, source: Source = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(ApiError.badRequest('Validation failed', result.error.flatten()));
    }
    // req.query/params can be read-only in Express types — assign through a cast.
    (req as Record<Source, unknown>)[source] = result.data;
    next();
  };
