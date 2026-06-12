// Usage events — counts metered AI actions (e.g. compare) for plan quotas.

import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/apiError.js';

export const usageRepository = {
  /** Number of events of `kind` for a user since an ISO timestamp. */
  async countSince(userId: string, kind: string, sinceISO: string): Promise<number> {
    const { count, error } = await supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('kind', kind)
      .gte('created_at', sinceISO);
    // If the table doesn't exist yet (admin-setup.sql not run), don't block usage.
    if (error) return 0;
    return count ?? 0;
  },

  async log(userId: string, kind: string): Promise<void> {
    const { error } = await supabase.from('usage_events').insert({ user_id: userId, kind });
    if (error) throw new ApiError(500, 'USAGE_LOG_FAILED', error.message);
  },
};
