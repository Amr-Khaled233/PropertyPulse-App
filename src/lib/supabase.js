// Backward-compatible re-export. The single source of truth is the env-based
// client in services/supabase/supabaseClient.ts (SecureStore-backed sessions).
export { supabase } from '../services/supabase/supabaseClient';
