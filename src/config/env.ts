import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

function read(key: string, fallback = ''): string {
  return process.env[key] ?? extra[key] ?? fallback;
}

export const env = {
  apiUrl: read('EXPO_PUBLIC_API_URL', extra.apiUrl ?? 'http://localhost:4000/api'),
  supabaseUrl: read('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: read('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  googleWebClientId: read('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
  // True only when real Supabase creds are present; otherwise the app runs in
  // demo mode against local mock data so it is fully usable without a backend.
  get hasSupabase() {
    return Boolean(this.supabaseUrl && this.supabaseAnonKey);
  },
};

export type AppEnv = typeof env;