// Auth — backend email/password (/auth/*) + Google OAuth via Supabase.
// The backend returns { user, accessToken, refreshToken }; we persist the token
// via tokenStore (SecureStore) and the apiClient attaches it to every request.

import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { apiClient } from './apiClient';
import { tokenStore } from './tokenStore';
import { requireSupabase, supabase } from '../supabase/supabaseClient';
import type { UserProfile } from '../../types/user';

WebBrowser.maybeCompleteAuthSession();

export interface AuthResult {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async login(email: string, password: string): Promise<UserProfile> {
    const { data } = await apiClient.post<AuthResult>('/auth/login', { email, password });
    await tokenStore.set(data.accessToken, data.refreshToken);
    return data.user;
  },

  async register(fullName: string, email: string, password: string): Promise<UserProfile> {
    // Backend register returns the profile only; sign in afterwards for a token.
    await apiClient.post<UserProfile>('/auth/register', { email, password, fullName });
    return this.login(email, password);
  },

  async me(): Promise<UserProfile> {
    const { data } = await apiClient.get<UserProfile>('/auth/me');
    return data;
  },

  async signInWithGoogle(): Promise<UserProfile> {
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
    const code = url.searchParams.get('code');
    const hash = new URLSearchParams(url.hash ? url.hash.slice(1) : '');

    let session = null;
    if (code) {
      const { data: ex, error: exErr } = await sb.auth.exchangeCodeForSession(code);
      if (exErr || !ex.session) throw new Error(exErr?.message ?? 'Google sign-in failed');
      session = ex.session;
    } else {
      const access_token = hash.get('access_token');
      const refresh_token = hash.get('refresh_token');
      if (!access_token || !refresh_token) throw new Error('No session returned from Google');
      const { data: setData, error: setErr } = await sb.auth.setSession({ access_token, refresh_token });
      if (setErr || !setData.session) throw new Error(setErr?.message ?? 'Google sign-in failed');
      session = setData.session;
    }

    // Use the Supabase token as the backend Bearer, then load the profile.
    await tokenStore.set(session.access_token, session.refresh_token);
    return this.me();
  },

  async resetPassword(email: string): Promise<void> {
    if (!supabase) return;
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'propertypulse://auth-callback' });
  },

  async signOut(): Promise<void> {
    await tokenStore.clear();
    if (supabase) await supabase.auth.signOut();
  },

  async hasSession(): Promise<boolean> {
    if (await tokenStore.getAccess()) return true;
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      return Boolean(data.session);
    }
    return false;
  },
};
