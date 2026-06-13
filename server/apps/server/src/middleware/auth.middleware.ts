// Auth guard — verifies the Supabase access token from the Authorization header
// and attaches the authenticated user to req.user.
//
// When SUPABASE_JWT_SECRET is set in .env, tokens are verified locally with
// HMAC-SHA256 (no network round-trip, immune to key-format issues).
// Without it, falls back to supabase.auth.getUser() which hits Supabase's API.

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

interface JwtClaims {
  sub: string;
  email?: string;
  role?: string;
  exp?: number;
  user_metadata?: Record<string, unknown>;
}

function verifySupabaseJwt(token: string, secret: string): JwtClaims {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [header, payload, sig] = parts;

  const expected = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  const a = Buffer.from(sig, 'base64url');
  const b = Buffer.from(expected, 'base64url');
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error('Invalid token signature');

  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as JwtClaims;
  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp === 'number' && claims.exp < now) throw new Error('Token expired');
  if (!claims.sub) throw new Error('Token missing subject');

  return claims;
}

export const requireAuth: RequestHandler = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing bearer token');
  }

  const token = header.slice('Bearer '.length);

  // --- Fast path: local JWT verification (no Supabase network call) ---
  if (env.SUPABASE_JWT_SECRET) {
    try {
      const claims = verifySupabaseJwt(token, env.SUPABASE_JWT_SECRET);
      const meta = (claims.user_metadata ?? {}) as { full_name?: string; name?: string };
      req.user = {
        id: claims.sub,
        email: claims.email,
        fullName: meta.full_name ?? meta.name,
      };
      return next();
    } catch (err) {
      throw ApiError.unauthorized((err as Error).message);
    }
  }

  // --- Fallback: validate via Supabase Auth API ---
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    console.error('[requireAuth] supabase.auth.getUser failed:', error?.message, error?.status);
    throw ApiError.unauthorized(error?.message ?? 'Invalid or expired token');
  }

  const meta = (data.user.user_metadata ?? {}) as { full_name?: string; name?: string };
  req.user = {
    id: data.user.id,
    email: data.user.email,
    fullName: meta.full_name ?? meta.name,
  };
  next();
});
