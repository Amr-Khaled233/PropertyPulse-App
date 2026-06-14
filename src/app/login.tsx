// Login screen (Expo Router route) — backend email/password + Google.

import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/common/Screen';
import { AppText } from '../components/common/Text';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { BrandMark } from '../components/common/Brand';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/theme';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/api/authService';
import { isEmail, isStrongPassword } from '../utils/validators';

export default function LoginScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const signInEmail = useAuthStore((s) => s.signInEmail);
  const signInGoogle = useAuthStore((s) => s.signInGoogle);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSignIn() {
    setError(null);
    if (!isEmail(email)) return setError(t('auth.emailRequired'));
    if (!isStrongPassword(password)) return setError(t('auth.passwordRequired'));
    setLoading(true);
    try {
      await signInEmail(email.trim(), password);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInGoogle();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setGoogleLoading(false);
    }
  }

  async function onForgot() {
    if (!isEmail(email)) return setError(t('forgot.enterEmail'));
    try {
      await authService.resetPassword(email.trim());
    } catch {
      /* never reveal account existence */
    }
    Alert.alert(t('forgot.title'), t('forgot.sent', { email }));
  }

  return (
    <Screen padded>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 32 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <BrandMark size={28} />
          </View>

          <AppText style={{ fontFamily: fonts.serif, fontSize: 28 }}>{t('auth.welcome')}</AppText>
          <AppText color="textMuted" style={{ marginTop: 6, marginBottom: 28 }}>{t('auth.welcomeSub')}</AppText>

          <View style={{ gap: 16 }}>
            <Input label={t('auth.email')} icon="mail-outline" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" />
            <Input label={t('auth.password')} icon="lock-closed-outline" password value={password} onChangeText={setPassword} placeholder="••••••••" />
            <Pressable style={{ alignSelf: 'flex-end' }} onPress={onForgot}>
              <AppText variant="label" color="secondary">{t('auth.forgotPassword')}</AppText>
            </Pressable>

            {error && <AppText variant="caption" color="danger">{error}</AppText>}

            <Button label={t('auth.signIn')} onPress={onSignIn} loading={loading} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
              <AppText variant="caption" color="textMuted">{t('auth.or')}</AppText>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
            </View>

            <Button label={t('auth.continueWithGoogle')} variant="google" onPress={onGoogle} loading={googleLoading} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 28 }}>
            <AppText color="textMuted">{t('auth.noAccount')}</AppText>
            <Pressable onPress={() => router.push('/register')}>
              <AppText color="secondary" style={{ fontFamily: fonts.semibold }}>{t('auth.signUp')}</AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
