// Landing — app entry point for visitors with no session. Mirrors the web landing.

import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/common/Screen';
import { AppText } from '../components/common/Text';
import { Button } from '../components/common/Button';
import { BrandMark } from '../components/common/Brand';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/theme';

const HIGHLIGHTS: { icon: keyof typeof Ionicons.glyphMap; key: string }[] = [
  { icon: 'sparkles-outline', key: 'landing.f1' },
  { icon: 'trending-up-outline', key: 'landing.f2' },
  { icon: 'shield-checkmark-outline', key: 'landing.f3' },
];

export default function LandingScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Screen padded>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40, gap: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center' }}>
          <BrandMark size={30} />
        </View>

        <View style={{ gap: 12 }}>
          <AppText style={{ fontFamily: fonts.serif, fontSize: 33, lineHeight: 42 }}>{t('landing.title')}</AppText>
          <AppText color="textMuted" style={{ fontSize: 15, lineHeight: 23 }}>{t('landing.subtitle')}</AppText>
        </View>

        <View style={{ gap: 14 }}>
          {HIGHLIGHTS.map((h) => (
            <View key={h.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.secondaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={h.icon} size={20} color={c.secondary} />
              </View>
              <AppText color="textSecondary" style={{ flex: 1 }}>{t(h.key)}</AppText>
            </View>
          ))}
        </View>

        <View style={{ gap: 12, marginTop: 8 }}>
          <Button label={t('landing.getStarted')} onPress={() => router.push('/register')} />
          <Button label={t('landing.signIn')} variant="outlined" onPress={() => router.push('/login')} />
        </View>
      </ScrollView>
    </Screen>
  );
}
