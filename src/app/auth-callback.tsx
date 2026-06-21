// Handles the OAuth deep link redirect from Supabase after Google sign-in.
// Supabase redirects to propertypulse://auth-callback?code=xxx (PKCE flow)
// or propertypulse://auth-callback#access_token=xxx&refresh_token=xxx (implicit).

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Linking from 'expo-linking';
import { Screen } from '../components/common/Screen';
import { InlineLoader } from '../components/common/Loader';
import { AppText } from '../components/common/Text';
import { Button } from '../components/common/Button';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/theme';
import { requireSupabase } from '../services/supabase/supabaseClient';
import { tokenStore } from '../services/api/tokenStore';
import { authService } from '../services/api/authService';
import { useAuthStore } from '../store/authStore';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ code?: string; access_token?: string; refresh_token?: string }>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const sb = requireSupabase();
    let done = false;

    // Complete sign-in from whatever source produces a session first.
    async function finish(session: { access_token: string; refresh_token: string }) {
      if (done) return;
      done = true;
      try {
        await tokenStore.set(session.access_token, session.refresh_token);
        const user = await authService.me();
        useAuthStore.setState({ status: 'authenticated', user, error: null });
        router.replace('/');
      } catch {
        done = false; // let another source retry
      }
    }

    // 1) The moment Supabase establishes a session (deep link), go straight in.
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (session) void finish(session);
    });

    // 2) Also try to complete the flow ourselves from the callback URL.
    (async () => {
      try {
        let code = typeof params.code === 'string' ? params.code : null;
        let access_token = typeof params.access_token === 'string' ? params.access_token : null;
        let refresh_token = typeof params.refresh_token === 'string' ? params.refresh_token : null;

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
              if (qIdx !== -1) code = new URLSearchParams(url.slice(qIdx + 1, hIdx !== -1 ? hIdx : undefined)).get('code');
              if (hIdx !== -1) {
                const hp = new URLSearchParams(url.slice(hIdx + 1));
                access_token = hp.get('access_token');
                refresh_token = hp.get('refresh_token');
              }
            }
          }
        }

        if (code) {
          const { data } = await sb.auth.exchangeCodeForSession(code);
          if (data.session) await finish(data.session);
        } else if (access_token && refresh_token) {
          const { data } = await sb.auth.setSession({ access_token, refresh_token });
          if (data.session) await finish(data.session);
        }
      } catch {
        /* ignore — onAuthStateChange / an existing session may still complete it */
      }

      // 3) Maybe a session already exists.
      const { data } = await sb.auth.getSession();
      if (data.session) await finish(data.session);
    })();

    // 4) Only show the failure screen if NOTHING signed us in within the window.
    const timer = setTimeout(() => { if (!done) setFailed(true); }, 9000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen padded>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {failed ? (
          <>
            <View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: c.secondaryMuted, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="logo-google" size={30} color={c.secondary} />
            </View>
            <AppText style={{ fontFamily: fonts.serif, fontSize: 21 }} center>{t('auth.googleFailedTitle')}</AppText>
            <AppText color="textMuted" center>{t('auth.googleFailedBody')}</AppText>
            <Button label={t('auth.signIn')} onPress={() => router.replace('/login')} fullWidth={false} style={{ marginTop: 4 }} />
          </>
        ) : (
          <>
            <InlineLoader />
            <AppText color="textMuted">{t('auth.completingSignIn')}</AppText>
          </>
        )}
      </View>
    </Screen>
  );
}
