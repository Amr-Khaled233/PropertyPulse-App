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
    // Register the session with the Supabase client so it can auto-refresh
    // the access token before the 1-hour expiry.
    if (supabase) {
      await supabase.auth.setSession({ access_token: data.accessToken, refresh_token: data.refreshToken });
    }
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
    if (!result.url) throw new Error('No redirect URL received from Google');

    // Parse both PKCE (code in query) and implicit (tokens in hash) flows.
    let code: string | null = null;
    let access_token: string | null = null;
    let refresh_token: string | null = null;

    try {
      const parsed = new URL(result.url);
      code = parsed.searchParams.get('code');
      const hashParams = new URLSearchParams(parsed.hash ? parsed.hash.slice(1) : '');
      access_token = hashParams.get('access_token');
      refresh_token = hashParams.get('refresh_token');
    } catch {
      // Fallback manual parsing for custom-scheme URLs that URL() may mishandle.
      const raw = result.url;
      const qIdx = raw.indexOf('?');
      const hIdx = raw.indexOf('#');
      if (qIdx !== -1) {
        const qs = raw.slice(qIdx + 1, hIdx !== -1 ? hIdx : undefined);
        code = new URLSearchParams(qs).get('code');
      }
      if (hIdx !== -1) {
        const hp = new URLSearchParams(raw.slice(hIdx + 1));
        access_token = hp.get('access_token');
        refresh_token = hp.get('refresh_token');
      }
    }

    let session = null;
    if (code) {
      const { data: ex, error: exErr } = await sb.auth.exchangeCodeForSession(code);
      if (exErr || !ex.session) throw new Error(exErr?.message ?? 'Google code exchange failed');
      session = ex.session;
    } else if (access_token && refresh_token) {
      const { data: setData, error: setErr } = await sb.auth.setSession({ access_token, refresh_token });
      if (setErr || !setData.session) throw new Error(setErr?.message ?? 'Google sign-in failed');
      session = setData.session;
    } else {
      throw new Error('Google sign-in returned no credentials. Ensure the redirect URL is whitelisted in your Supabase dashboard: ' + redirectTo);
    }

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
