// Handles the OAuth deep link redirect from Supabase after Google sign-in.
// Supabase redirects to propertypulse://auth-callback?code=xxx (PKCE flow)
// or propertypulse://auth-callback#access_token=xxx&refresh_token=xxx (implicit).

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { Screen } from '../components/common/Screen';
import { InlineLoader } from '../components/common/Loader';
import { AppText } from '../components/common/Text';
import { requireSupabase } from '../services/supabase/supabaseClient';
import { tokenStore } from '../services/api/tokenStore';
import { authService } from '../services/api/authService';
import { useAuthStore } from '../store/authStore';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; access_token?: string; refresh_token?: string }>();
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Expo Router passes query params via useLocalSearchParams (PKCE flow).
        let code = typeof params.code === 'string' ? params.code : null;
        let access_token = typeof params.access_token === 'string' ? params.access_token : null;
        let refresh_token = typeof params.refresh_token === 'string' ? params.refresh_token : null;

        // Fall back to parsing the raw deep-link URL for hash-based implicit tokens.
        if (!code && !access_token) {
          const url = await Linking.getInitialURL();
          if (url) {
            try {
              const parsed = new URL(url);
              code = parsed.searchParams.get('code');
              const hp = new URLSearchParams(parsed.hash?.slice(1) ?? '');
              access_token = hp.get('access_token');
              refresh_token = hp.get('refresh_token');
            } catch {
              const qIdx = url.indexOf('?');
              const hIdx = url.indexOf('#');
              if (qIdx !== -1)
                code = new URLSearchParams(url.slice(qIdx + 1, hIdx !== -1 ? hIdx : undefined)).get('code');
              if (hIdx !== -1) {
                const hp = new URLSearchParams(url.slice(hIdx + 1));
                access_token = hp.get('access_token');
                refresh_token = hp.get('refresh_token');
              }
            }
          }
        }

        const sb = requireSupabase();
        let session = null;

        if (code) {
          const { data, error } = await sb.auth.exchangeCodeForSession(code);
          if (error || !data.session) throw error ?? new Error('Code exchange failed');
          session = data.session;
        } else if (access_token && refresh_token) {
          const { data, error } = await sb.auth.setSession({ access_token, refresh_token });
          if (error || !data.session) throw error ?? new Error('Session setup failed');
          session = data.session;
        } else {
          throw new Error('No credentials found in the callback URL.');
        }

        await tokenStore.set(session.access_token, session.refresh_token);
        const user = await authService.me();
        useAuthStore.setState({ status: 'authenticated', user, error: null });
        router.replace('/home');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Authentication failed';
        setErrMsg(msg);
        setTimeout(() => router.replace('/login'), 2500);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 }}>
        {errMsg ? (
          <AppText color="danger" center>{errMsg}</AppText>
        ) : (
          <InlineLoader />
        )}
      </View>
    </Screen>
  );
}
