import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { BrandMark } from '../../components/common/Brand';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';

import { isEmail, isStrongPassword, isNonEmpty } from '../../utils/validators';
import type { AuthStackParamList } from '../../navigation/types';
import { useGoogleAuth } from '@/src/hooks/useGoogle';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router'

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

type InvestorType = 'individual' | 'institutional' | 'family_office';

export function RegisterScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const c = theme.colors;
const { handleGoogleAuth } = useGoogleAuth()

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [investorType, setInvestorType] = useState<InvestorType>('individual');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const types: { key: InvestorType; label: string }[] = [
    { key: 'individual', label: t('auth.investorIndividual') },
    { key: 'institutional', label: t('auth.investorInstitutional') },
    { key: 'family_office', label: t('auth.investorFamilyOffice') },
  ];

async function onSignUp() {
  setError(null);

  if (!isNonEmpty(fullName)) {
    return setError(t('auth.nameRequired'));
  }

  if (!isEmail(email)) {
    return setError(t('auth.emailRequired'));
  }

  if (!isStrongPassword(password)) {
    return setError(t('auth.passwordRequired'));
  }

  setLoading(true);

  try {
    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,

        options: {
          data: {
            full_name: fullName,
            investor_type: investorType,
          },
        },
      });

    if (error) {
      throw error;
    }

    // Email confirmation enabled
    if (
      data.user &&
      !data.session
    ) {
      Alert.alert(
        t('common.appName'),
        t('auth.confirmEmail')
      );

      navigation.navigate('Login');

      return;
    }

    // User logged in immediately
    Alert.alert(
      t('common.appName'),
      t('auth.accountCreated')
    );

    // navigation.replace('MainTabs');

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

  return (
    <Screen padded>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 28 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <BrandMark size={26} />
          </View>

          <AppText style={{ fontFamily: fonts.serif, fontSize: 28 }}>{t('auth.createAccount')}</AppText>
          <AppText color="textMuted" style={{ marginTop: 6, marginBottom: 24 }}>
            {t('auth.createSub')}
          </AppText>

          <View style={{ gap: 16 }}>
            <Input label={t('auth.fullName')} icon="person-outline" value={fullName} onChangeText={setFullName} placeholder={t('auth.fullNamePlaceholder')} />
            <Input
              label={t('auth.email')}
              icon="mail-outline"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
            />
            <Input label={t('auth.password')} icon="lock-closed-outline" password value={password} onChangeText={setPassword} placeholder="••••••••" />

            {/* Investor type */}
            <View style={{ gap: 8 }}>
              <AppText variant="label" color="textSecondary">{t('auth.investorType')}</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {types.map((ty) => {
                  const active = investorType === ty.key;
                  return (
                    <Pressable
                      key={ty.key}
                      onPress={() => setInvestorType(ty.key)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: radius.pill,
                        borderWidth: 1.5,
                        borderColor: active ? c.secondary : c.border,
                        backgroundColor: active ? c.secondaryMuted : c.surface,
                      }}
                    >
                      <AppText style={{ fontFamily: fonts.medium, fontSize: 13, color: active ? c.secondary : c.textSecondary }}>
                        {ty.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {error && <AppText variant="caption" color="danger">{error}</AppText>}

            <AppText variant="caption" color="textMuted" style={{ lineHeight: 17 }}>
              {t('auth.termsPrefix')}{' '}
              <AppText variant="caption" color="secondary" style={{ fontFamily: fonts.semibold }}>{t('auth.terms')}</AppText>
              {' '}{t('auth.and')}{' '}
              <AppText variant="caption" color="secondary" style={{ fontFamily: fonts.semibold }}>{t('auth.privacy')}</AppText>.
            </AppText>

            <Button label={t('auth.createAccountCta')} onPress={onSignUp} loading={loading} />
            <Button label={t('Sign up with Google')} onPress={handleGoogleAuth} loading={loading} />

          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 22 }}>
            <AppText color="textMuted">{t('auth.haveAccount')}</AppText>
                <Pressable onPress={() => router.push('/login')}>
              <AppText color="secondary" style={{ fontFamily: fonts.semibold }}>{t('auth.signIn')}</AppText>
            </Pressable>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}