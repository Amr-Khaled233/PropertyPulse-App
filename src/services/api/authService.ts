import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '@propertypulse/shared-types';
import { requireSupabase, supabase } from '../supabase/supabaseClient';

WebBrowser.maybeCompleteAuthSession();

export interface Credentials {
  email: string;
  password: string;
}

function rowToProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    email: String(row.email ?? ''),
    fullName: (row.full_name as string) ?? undefined,
    role: (row.role as UserProfile['role']) ?? 'investor',
    avatarUrl: (row.avatar_url as string) ?? undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export const authService = {
  async signInWithEmail({ email, password }: Credentials): Promise<Session> {
    const sb = requireSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new Error(error?.message ?? 'Invalid credentials');
    return data.session;
  },

  async signUpWithEmail(
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ session: Session | null; needsConfirmation: boolean }> {
    const sb = requireSupabase();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw new Error(error.message);
    return { session: data.session, needsConfirmation: !data.session };
  },

  async signInWithGoogle(): Promise<Session> {
    const sb = requireSupabase();
    const redirectTo = makeRedirectUri({ scheme: 'propertypulse', path: 'auth-callback' });

    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) throw new Error(error?.message ?? 'Could not start Google sign-in');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success') throw new Error('Google sign-in was cancelled');

    const url = new URL(result.url);
    const params = new URLSearchParams(url.hash ? url.hash.slice(1) : url.search.slice(1));
    const code = url.searchParams.get('code');

    if (code) {
      const { data: ex, error: exErr } = await sb.auth.exchangeCodeForSession(code);
      if (exErr || !ex.session) throw new Error(exErr?.message ?? 'Google sign-in failed');
      return ex.session;
    }

    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) throw new Error('No session returned from Google');

    const { data: setData, error: setErr } = await sb.auth.setSession({ access_token, refresh_token });
    if (setErr || !setData.session) throw new Error(setErr?.message ?? 'Google sign-in failed');
    return setData.session;
  },

  async signOut(): Promise<void> {
    if (supabase) await supabase.auth.signOut();
  },

  async resetPassword(email: string): Promise<void> {
    if (!supabase) return; // demo mode — no-op
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'propertypulse://auth-callback' });
  },

  async getSession(): Promise<Session | null> {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  /** Fetch the profile row for a user (auto-created by a DB trigger). */
  async fetchProfile(userId: string): Promise<UserProfile | null> {
    const sb = requireSupabase();
    const { data, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? rowToProfile(data as Record<string, unknown>) : null;
  },

  async updateProfile(userId: string, patch: { fullName?: string; avatarUrl?: string }): Promise<UserProfile> {
    const sb = requireSupabase();
    const { data, error } = await sb
      .from('profiles')
      .update({ full_name: patch.fullName, avatar_url: patch.avatarUrl })
      .eq('id', userId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return rowToProfile(data as Record<string, unknown>);
  },
};