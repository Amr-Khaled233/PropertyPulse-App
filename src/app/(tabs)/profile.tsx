// Profile — account, appearance (theme), language (RTL), admin, sign out.

import { Alert, ScrollView, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Chip } from '../../components/common/Chip';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { useAuthStore } from '../../store/authStore';
import { useUiStore, type Language, type ThemePreference } from '../../store/uiStore';
import { useWatchlistStore } from '../../store/watchlistStore';
import { applyLanguage } from '../../i18';

export default function ProfileScreen() {
  const { theme, preference, setPreference } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const resetWatch = useWatchlistStore((s) => s.reset);
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);

  async function changeLanguage(lang: Language) {
    if (lang === language) return;
    setLanguage(lang);
    const { rtlChanged } = await applyLanguage(lang);
    if (rtlChanged) Alert.alert(t('profile.rtlTitle'), t('profile.rtlBody'));
  }

  function confirmSignOut() {
    Alert.alert(t('auth.signOut'), t('profile.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.signOut'),
        style: 'destructive',
        onPress: async () => { await signOut(); resetWatch(); router.replace('/login'); },
      },
    ]);
  }

  const themeOptions: { key: ThemePreference; label: string }[] = [
    { key: 'light', label: t('profile.themeLight') },
    { key: 'dark', label: t('profile.themeDark') },
    { key: 'system', label: t('profile.themeSystem') },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <AppText style={{ fontFamily: fonts.serif, fontSize: 26 }}>{t('profile.title')}</AppText>

        {/* Account */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.secondaryMuted, alignItems: 'center', justifyContent: 'center' }}>
              <AppText style={{ fontFamily: fonts.serif, fontSize: 22, color: c.secondary }}>
                {(user?.fullName ?? user?.email ?? '?').charAt(0).toUpperCase()}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={{ fontFamily: fonts.semibold, fontSize: 16 }}>{user?.fullName ?? t('profile.investor')}</AppText>
              <AppText variant="caption" color="textMuted">{user?.email}</AppText>
            </View>
            <Badge label={user?.plan ?? 'free'} tone={user?.plan && user.plan !== 'free' ? 'success' : 'neutral'} />
          </View>
        </Card>

        {/* Appearance */}
        <Section title={t('profile.theme')}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {themeOptions.map((o) => (
              <Chip key={o.key} label={o.label} selected={preference === o.key} onPress={() => setPreference(o.key)} />
            ))}
          </View>
        </Section>

        {/* Language */}
        <Section title={t('profile.language')}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip label={t('profile.english')} selected={language === 'en'} onPress={() => changeLanguage('en')} />
            <Chip label={t('profile.arabic')} selected={language === 'ar'} onPress={() => changeLanguage('ar')} />
          </View>
        </Section>

        {/* Links */}
        <Card padded={false}>
          <LinkRow icon="diamond-outline" label={t('pricing.title')} onPress={() => router.push('/pricing')} c={c} />
          {user?.role === 'admin' && (
            <>
              <Divider c={c} />
              <LinkRow icon="shield-checkmark-outline" label={t('admin.title')} onPress={() => router.push('/admin')} c={c} />
            </>
          )}
        </Card>

        <Pressable
          onPress={confirmSignOut}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: c.danger }}
        >
          <Ionicons name="log-out-outline" size={18} color={c.danger} />
          <AppText style={{ fontFamily: fonts.semibold, color: c.danger }}>{t('auth.signOut')}</AppText>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <AppText variant="label" color="textSecondary">{title}</AppText>
      {children}
    </View>
  );
}

function LinkRow({ icon, label, onPress, c }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; c: { text: string; textMuted: string; secondary: string } }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
      <Ionicons name={icon} size={20} color={c.secondary} />
      <AppText style={{ flex: 1, fontFamily: fonts.medium }}>{label}</AppText>
      <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
    </Pressable>
  );
}

function Divider({ c }: { c: { border: string } }) {
  return <View style={{ height: 1, backgroundColor: c.border, marginHorizontal: 16 }} />;
}
