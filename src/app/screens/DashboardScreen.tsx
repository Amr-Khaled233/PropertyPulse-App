import { Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { SectionHeader, StatTile } from '../../components/common/Section';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/theme';
import { useAuthStore } from '../../store/authStore';
import { formatCompact, formatPercent, formatSigned } from '../../utils/formatters';
import { useListings } from '../../hooks/useListings';
import type { RootStackParamList } from '../../navigation/types';

function greetingKey(): 'home.greetingMorning' | 'home.greetingAfternoon' | 'home.greetingEvening' {
  const h = new Date().getHours();
  if (h < 12) return 'home.greetingMorning';
  if (h < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

export function DashboardScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const c = theme.colors;
  const user = useAuthStore((s) => s.user);
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const firstName = user?.fullName?.split(' ')[0] ?? 'Investor';

  const { properties, loading } = useListings({ limit: 3, offering_type: 'for_sale' });

  const portfolioSummary = {
    totalValue: 2500000,
    changePct: 0.15,
    netYieldPct: 0.08,
    propertiesCount: 5,
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 22 }} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: c.secondaryMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="person" size={20} color={c.secondary} />
          </View>
          <View>
            <AppText style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1, color: c.textMuted }}>
              {t('home.welcomeBack')}
            </AppText>
            <AppText style={{ fontFamily: fonts.serif, fontSize: 24, color: c.text }}>
              {t(greetingKey())}, {firstName}
            </AppText>
          </View>
        </View>

        {/* Portfolio value */}
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1, color: c.textMuted }}>
              {t('home.portfolioValue')}
            </AppText>
            <Badge label={`+${formatPercent(portfolioSummary.changePct)}`} tone="success" icon="arrow-up" />
          </View>
          <AppText style={{ fontFamily: fonts.heading, fontSize: 34, color: c.text, marginTop: 6 }}>
            {formatCompact(portfolioSummary.totalValue)}{' '}
            <AppText style={{ fontFamily: fonts.semibold, fontSize: 18, color: c.textMuted }}>EGP</AppText>
          </AppText>
          <View style={{ flexDirection: 'row', marginTop: 18, gap: 12 }}>
            <StatTile label={t('home.netYield')} value={formatPercent(portfolioSummary.netYieldPct)} valueColor={c.secondary} />
            <View style={{ width: 1, backgroundColor: c.border }} />
            <StatTile label={t('home.properties')} value={`${portfolioSummary.propertiesCount}`} />
          </View>
        </Card>

        {/* AI Insight */}
        <Card tone="inverse">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Ionicons name="sparkles" size={16} color={c.secondary} />
            <AppText style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1, color: c.secondary }}>
              {t('home.aiInsight')}
            </AppText>
          </View>
          <AppText style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: '#E7ECF3' }}>
            {t('home.aiInsightBody')}
          </AppText>
          <Pressable onPress={() => nav.navigate('Main', { screen: 'Chat' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 14 }}>
            <AppText style={{ fontFamily: fonts.semibold, fontSize: 13, color: c.secondary }}>
              {t('home.viewStrategy')}
            </AppText>
            <Ionicons name="arrow-forward" size={14} color={c.secondary} />
          </Pressable>
        </Card>

        {/* Top opportunities */}
        <View>
          <SectionHeader title={t('home.topOpportunities')} onSeeAll={() => nav.navigate('Main', { screen: 'Search' })} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            {!loading && properties.map((p) => (
              <Pressable key={p.listing_id} onPress={() => nav.navigate('PropertyDetail', { id: p.listing_id })} style={{ width: 210 }}>
                <Card padded={false}>
                  {p.images_count && p.images_count > 0 && (
                    <Image source={{ uri: `https://via.placeholder.com/300x200?text=${p.title}` }} style={{ width: '100%', height: 110, borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
                  )}
                  <View style={{ padding: 12, gap: 6 }}>
                    <Badge label={`${((p.price_egp || 0) / 1000000).toFixed(1)}M EGP`} tone="success" />
                    <AppText style={{ fontFamily: fonts.serif, fontSize: 16, color: c.secondary }}>{p.title}</AppText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="location-outline" size={12} color={c.textMuted} />
                      <AppText variant="caption" color="textMuted">{p.city}, Egypt</AppText>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Market activity */}
        <View>
          <SectionHeader title={t('home.marketActivity')} />
          <Card padded>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: c.secondaryMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="cash-outline" size={18} color={c.secondary} />
                </View>
                <View>
                  <AppText style={{ fontFamily: fonts.semibold, fontSize: 14 }}>
                    {t('home.rentalIncome')}
                  </AppText>
                  <AppText variant="caption" color="textMuted">Today</AppText>
                </View>
              </View>
              <AppText style={{ fontFamily: fonts.semibold, fontSize: 14, color: c.secondary }}>
                {formatSigned(12000)}
              </AppText>
            </View>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}