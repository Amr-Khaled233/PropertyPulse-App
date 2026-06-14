// Register screen (Expo Router route) — backend register + Google.

import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
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
import { isEmail, isStrongPassword, isNonEmpty } from '../utils/validators';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const signUpEmail = useAuthStore((s) => s.signUpEmail);
  const signInGoogle = useAuthStore((s) => s.signInGoogle);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function onSignUp() {
    setError(null);
    if (!isNonEmpty(fullName)) return setError(t('auth.nameRequired'));
    if (!isEmail(email)) return setError(t('auth.emailRequired'));
    if (!isStrongPassword(password)) return setError(t('auth.passwordRequired'));
    setLoading(true);
    try {
      await signUpEmail(fullName.trim(), email.trim(), password);
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

  return (
    <Screen padded>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 32 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <BrandMark size={26} />
          </View>

          <AppText style={{ fontFamily: fonts.serif, fontSize: 28 }}>{t('auth.createAccount')}</AppText>
          <AppText color="textMuted" style={{ marginTop: 6, marginBottom: 24 }}>{t('auth.createSub')}</AppText>

          <View style={{ gap: 16 }}>
            <Input label={t('auth.fullName')} icon="person-outline" value={fullName} onChangeText={setFullName} placeholder="Ahmed Hassan" />
            <Input label={t('auth.email')} icon="mail-outline" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" />
            <Input label={t('auth.password')} icon="lock-closed-outline" password value={password} onChangeText={setPassword} placeholder="••••••••" />

            {error && <AppText variant="caption" color="danger">{error}</AppText>}

            <Button label={t('auth.signUp')} onPress={onSignUp} loading={loading} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
              <AppText variant="caption" color="textMuted">{t('auth.or')}</AppText>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
            </View>

            <Button label={t('auth.continueWithGoogle')} variant="google" onPress={onGoogle} loading={googleLoading} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 }}>
            <AppText color="textMuted">{t('auth.haveAccount')}</AppText>
            <Pressable onPress={() => router.replace('/login')}>
              <AppText color="secondary" style={{ fontFamily: fonts.semibold }}>{t('auth.signIn')}</AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
