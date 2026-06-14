// Home dashboard — live market snapshot + AI teaser + top opportunities.

import { useEffect, useState, useCallback } from 'react';
import { RefreshControl, ScrollView, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { AppHeader } from '../../components/common/Brand';
import { SectionHeader, StatTile } from '../../components/common/Section';
import { InlineLoader } from '../../components/common/Loader';
import { PropertyCard } from '../../components/PropertyCard';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { useAuthStore } from '../../store/authStore';
import { useWatchlistStore } from '../../store/watchlistStore';
import { marketService, type MarketOverview } from '../../services/api/marketService';
import { propertyService } from '../../services/api/propertyService';
import { inquiryService } from '../../services/api/inquiryService';
import { formatCompact } from '../../utils/formatters';
import type { Property } from '../../types/listing';

function greeting(t: (k: string) => string): string {
  const h = new Date().getHours();
  if (h < 12) return t('home.greetingMorning');
  if (h < 18) return t('home.greetingAfternoon');
  return t('home.greetingEvening');
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loadWatch = useWatchlistStore((s) => s.load);
  const toggleWatch = useWatchlistStore((s) => s.toggle);
  const entries = useWatchlistStore((s) => s.entries);

  const [market, setMarket] = useState<MarketOverview | null>(null);
  const [featured, setFeatured] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifCount, setNotifCount] = useState(0);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [m, page] = await Promise.all([
        marketService.overview(),
        propertyService.search({ pageSize: 6, page: 1 }),
      ]);
      setMarket(m);
      setFeatured(page.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
    // Load notification count separately — non-blocking.
    inquiryService.getMyInquiries()
      .then((list) => setNotifCount(list.filter((i) => i.status !== 'new').length))
      .catch(() => {});
  }, [t]);

  useEffect(() => {
    void load();
    void loadWatch();
  }, [load, loadWatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const firstName = user?.fullName?.split(' ')[0] ?? '';

  return (
    <Screen>
      <AppHeader onBell={() => router.push('/notifications')} onProfile={() => router.push('/profile')} bellCount={notifCount} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 18, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.secondary} />}
      >
        <View>
          <AppText variant="label" color="textMuted" style={{ letterSpacing: 1 }}>
            {t('home.welcomeBack')}
          </AppText>
          <AppText style={{ fontFamily: fonts.serif, fontSize: 26 }}>
            {greeting(t)}{firstName ? `, ${firstName}` : ''}
          </AppText>
        </View>

        {/* Live market snapshot */}
        <Card tone="inverse" padded>
          <Pressable onPress={() => router.push('/market')}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText variant="label" style={{ color: c.textOnInverse, opacity: 0.7, letterSpacing: 1 }}>
                {t('market.title').toUpperCase()}
              </AppText>
              <Ionicons name="arrow-forward" size={18} color={c.textOnInverse} />
            </View>
            {loading ? (
              <InlineLoader />
            ) : (
              <>
                <AppText style={{ fontFamily: fonts.serif, fontSize: 30, lineHeight: 40, color: c.textOnInverse, marginTop: 6 }}>
                  {formatCompact(market?.totalValue ?? 0, 'EGP')}
                </AppText>
                <AppText variant="caption" style={{ color: c.textOnInverse, opacity: 0.7 }}>
                  {t('market.totalValue')}
                </AppText>
                <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
                  <StatTileInverse label={t('market.activeListings')} value={(market?.activeListings ?? 0).toLocaleString()} />
                  <StatTileInverse label={t('market.avgPrice')} value={formatCompact(market?.avgPrice ?? 0)} />
                  <StatTileInverse label={t('market.appreciation')} value={`+${(market?.appreciationPct ?? 0).toFixed(1)}%`} accent />
                </View>
              </>
            )}
          </Pressable>
        </Card>

        {/* AI advisor teaser */}
        <Pressable onPress={() => router.push('/advisor')}>
          <Card style={{ borderColor: c.secondary, borderWidth: 1.5 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: c.secondaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="sparkles" size={22} color={c.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontFamily: fonts.semibold, fontSize: 15 }}>{t('home.aiInsight')}</AppText>
                <AppText variant="caption" color="textMuted" numberOfLines={2}>{t('home.aiInsightBody')}</AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
            </View>
          </Card>
        </Pressable>

        {/* Top opportunities */}
        <View>
          <SectionHeader title={t('home.topOpportunities')} onSeeAll={() => router.push('/search')} />
          {error && <AppText variant="caption" color="danger">{error}</AppText>}
          {loading ? (
            <InlineLoader />
          ) : (
            <View style={{ gap: 14 }}>
              {featured.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  watched={entries.some((e) => e.propertyId === p.id)}
                  onToggleWatch={toggleWatch}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function StatTileInverse({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      {/* `accent` must contrast the inverse card (emerald in dark / navy in light);
          secondary is emerald and would vanish on the dark emerald card, so use gold. */}
      <AppText style={{ fontFamily: fonts.heading, fontSize: 16, color: accent ? theme.colors.star : theme.colors.textOnInverse }}>
        {value}
      </AppText>
      <AppText style={{ fontFamily: fonts.medium, fontSize: 9, letterSpacing: 0.5, color: theme.colors.textOnInverse, opacity: 0.6, marginTop: 2 }}>
        {label.toUpperCase()}
      </AppText>
    </View>
  );
}
