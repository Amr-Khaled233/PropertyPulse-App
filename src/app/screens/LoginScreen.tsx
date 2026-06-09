import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'

import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { BrandMark } from '../../components/common/Brand';

import { useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/theme';

import { authService } from '../../services/api/authService';

import { isEmail, isStrongPassword } from '../../utils/validators';

import type { AuthStackParamList } from '../../navigation/types';

import { supabase } from '../../lib/supabase';
import { router } from 'expo-router'

WebBrowser.maybeCompleteAuthSession()

type Props = NativeStackScreenProps<
  AuthStackParamList,
  'Login'
>;

export function LoginScreen({
  navigation,
}: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] =
    useState('');

  const [error, setError] = useState<
    string | null
  >(null);

  const [loading, setLoading] =
    useState(false);

  // const [googleLoading, setGoogleLoading] =
  //   useState(false);

  async function onSignIn() {
    setError(null);

    if (!isEmail(email)) {
      return setError(
        t('auth.emailRequired')
      );
    }

    if (!isStrongPassword(password)) {
      return setError(
        t('auth.passwordRequired')
      );
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.signInWithPassword(
          {
            email,
            password,
          }
        );

      if (error) {
        throw error;
      }

      // navigation.replace('Home');

    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t('common.error')
      );
    } finally {
      setLoading(false);
    }
  }

  async function onForgot() {
    if (!isEmail(email)) {
      return setError(
        t('forgot.enterEmail')
      );
    }

    try {
      await authService.resetPassword(
        email
      );
    } catch {
      // ignore intentionally
    }

    Alert.alert(
      t('forgot.title'),
      t('forgot.sent', { email })
    );
  }

const handleGoogleAuth = async () => {
  try {
    await WebBrowser.dismissAuthSession()

    const redirectTo = AuthSession.makeRedirectUri({ scheme: 'propertypulse' })

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    })

    if (error || !data.url) {
      console.log('OAuth error:', error)
      return
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
    console.log('result:', result)

    if (result.type === 'success') {
      const url = new URL(result.url)
      const code = url.searchParams.get('code')
      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      }
    }
  } catch (e) {
    console.log('Google auth error:', e)
  }
}

  return (
    <Screen padded>
      <KeyboardAvoidingView
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingVertical: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              alignItems: 'center',
              marginBottom: 32,
            }}
          >
            <BrandMark size={28} />
          </View>

          <AppText
            style={{
              fontFamily: fonts.serif,
              fontSize: 28,
            }}
          >
            {t('auth.welcome')}
          </AppText>

          <AppText
            color="textMuted"
            style={{
              marginTop: 6,
              marginBottom: 28,
            }}
          >
            {t('auth.welcomeSub')}
          </AppText>

          <View style={{ gap: 16 }}>
            <Input
              label={t('auth.email')}
              icon="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
            />

            <Input
              label={t('auth.password')}
              icon="lock-closed-outline"
              password
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
            />

            <Pressable
              style={{
                alignSelf: 'flex-end',
              }}
              onPress={onForgot}
            >
              <AppText
                variant="label"
                color="secondary"
              >
                {t(
                  'auth.forgotPassword'
                )}
              </AppText>
            </Pressable>

            {error && (
              <AppText
                variant="caption"
                color="danger"
              >
                {error}
              </AppText>
            )}

            <Button
              label={t('auth.signIn')}
              onPress={onSignIn}
              loading={loading}
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginVertical: 4,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor:
                    theme.colors.border,
                }}
              />

              <AppText
                variant="caption"
                color="textMuted"
              >
                {t('auth.or')}
              </AppText>

              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor:
                    theme.colors.border,
                }}
              />
            </View>

            <Button
              label={t(
                'continue With Google'
              )}
              variant="google"
              onPress={handleGoogleAuth}
              // loading={googleLoading}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
              marginTop: 28,
            }}
          >
            <AppText color="textMuted">
              {t('auth.noAccount')}
            </AppText>

            <Pressable
              onPress={() =>
                router.push('/register')
              }
            >
              <AppText
                color="secondary"
                style={{
                  fontFamily:
                    fonts.semibold,
                }}
              >
                {t('auth.signUp')}
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}