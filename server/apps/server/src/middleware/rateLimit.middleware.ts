// Rate limiting middleware (express-rate-limit).

import rateLimit from 'express-rate-limit';

/** General API limiter: 100 requests / minute / IP. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

/** Tighter limiter for expensive AI endpoints: 10 requests / minute / IP. */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
