// Supabase admin client (service-role) for server-side data access.
// The service-role key bypasses Row Level Security — keep it server-only.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

// Isolated client used ONLY for user password sign-in. supabase-js stores the
// resulting user session on the client instance; if we did this on the main
// admin client above, every following DB query would run as that signed-in
// user (anon-level) and hit Row Level Security — making reads return nothing
// and profile upserts fail. Keeping sign-in on a separate client preserves the
// service-role context on `supabase`.
export const supabaseAuth: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
