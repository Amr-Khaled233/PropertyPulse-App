// Dashboard — portfolio metrics computed from the user's watchlist via the
// shared financial engine (so mobile and web numbers agree). Matches the web.

import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { AppHeader } from '../../components/common/Brand';
import { SectionHeader } from '../../components/common/Section';
import { InlineLoader } from '../../components/common/Loader';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { useAuthStore } from '../../store/authStore';
import { useWatchlistStore } from '../../store/watchlistStore';
import { inquiryService } from '../../services/api/inquiryService';
import { notifCache } from '../../services/api/notifCache';
import { buildAssumptions, computeInvestmentMetrics, estimateMonthlyRent, deriveRecommendation, type Recommendation } from '../../utils/financial';
import { formatCompact } from '../../utils/formatters';
import { displayTitle } from '../../utils/propertyTitle';

const REC: Record<Recommendation, { tone: 'success' | 'neutral' | 'danger'; labelKey: string; trend: string }> = {
  buy: { tone: 'success', labelKey: 'home.high', trend: '↗' },
  hold: { tone: 'neutral', labelKey: 'home.stable', trend: '→' },
  avoid: { tone: 'danger', labelKey: 'home.low', trend: '→' },
};

export default function HomeScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const entries = useWatchlistStore((s) => s.entries);
  const loadWatch = useWatchlistStore((s) => s.load);
  const watchLoading = useWatchlistStore((s) => s.loading);

  const [refreshing, setRefreshing] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  // Reload the watchlist + unread badge whenever the dashboard regains focus,
  // so headline numbers update live as properties are added/removed.
  useFocusEffect(
    useCallback(() => {
      void loadWatch();
      inquiryService
        .getMyInquiries()
        .then(async (list) => setNotifCount(await notifCache.countUnseen(list)))
        .catch(() => {});
    }, [loadWatch]),
  );

  const computed = useMemo(
    () =>
      entries
        .map((e) => e.property)
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .map((p) => {
          const a = buildAssumptions(p.price, { monthlyRent: estimateMonthlyRent(p.areaSqm, p.type) });
          const m = computeInvestmentMetrics(a);
          const { recommendation, score } = deriveRecommendation(m);
          return { property: p, metrics: m, recommendation, score };
        }),
    [entries],
  );

  const hasPortfolio = computed.length > 0;
  const portfolioValue = computed.reduce((s, x) => s + x.property.price, 0);
  const avgYield = hasPortfolio ? computed.reduce((s, x) => s + x.metrics.netRentalYield, 0) / computed.length : 0;
  const aiMarketScore = hasPortfolio ? computed.reduce((s, x) => s + x.score, 0) / computed.length / 10 : 0;
  const monthlyChangePct = hasPortfolio ? 1.0 : 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWatch();
    setRefreshing(false);
  }, [loadWatch]);

  const planLabel = (user?.plan ?? 'free').toUpperCase();
  const isPro = (user?.plan ?? 'free') !== 'free';

  return (
    <Screen>
      <AppHeader bellCount={notifCount} onBell={() => router.push('/notifications')} onProfile={() => router.push('/profile')} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 4, gap: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.secondary} />}
      >
        {/* Title + plan chip */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText style={{ fontFamily: fonts.serif, fontSize: 26 }}>{t('home.dashTitle')}</AppText>
          <Pressable onPress={() => router.push('/pricing')}>
            <View style={{ backgroundColor: isPro ? c.secondary : c.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 }}>
              <AppText style={{ fontFamily: fonts.semibold, fontSize: 12, color: isPro ? '#fff' : c.textSecondary }}>{planLabel}</AppText>
            </View>
          </Pressable>
        </View>

        {/* Four metric cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <MetricCard label={t('home.portfolioValue')} value={hasPortfolio ? `EGP ${formatCompact(portfolioValue)}` : '—'} sub={hasPortfolio ? t('home.thisMonth', { value: monthlyChangePct.toFixed(1) }) : undefined} subColor={c.success} c={c} />
          <MetricCard label={t('home.rentalYield')} value={hasPortfolio ? `${avgYield.toFixed(1)}%` : '—'} sub={t('home.benchmark', { value: '6.5' })} c={c} />
          <MetricCard label={t('home.propertiesTracked')} value={String(computed.length)} c={c} />
          <MetricCard label={t('home.aiMarketScore')} value={hasPortfolio ? `${aiMarketScore.toFixed(1)}/10` : '—'} c={c} dark />
        </View>

        {/* AI Advisor panel */}
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

        {/* Active portfolio */}
        <View>
          <SectionHeader title={t('home.activePortfolio')} onSeeAll={() => router.push('/portfolio')} />
          {watchLoading && !hasPortfolio ? (
            <InlineLoader />
          ) : !hasPortfolio ? (
            <Card>
              <AppText color="textMuted" center>{t('home.portfolioEmpty')}</AppText>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {computed.map(({ property: p, metrics, recommendation }) => {
                const r = REC[recommendation];
                const trendColor = r.tone === 'success' ? c.success : r.tone === 'danger' ? c.danger : c.textMuted;
                return (
                  <Pressable key={p.id} onPress={() => router.push(`/property/${p.id}`)}>
                    <Card>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <AppText numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 14 }}>{displayTitle(p)}</AppText>
                          <AppText variant="caption" color="textMuted" numberOfLines={1}>
                            {[p.address?.city, p.address?.country].filter(Boolean).join(', ')}
                          </AppText>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                          <AppText style={{ fontFamily: fonts.heading, fontSize: 14, color: c.secondary }}>{`EGP ${formatCompact(p.price)}`}</AppText>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Badge label={`${t(r.labelKey)} ${metrics.netRentalYield.toFixed(1)}%`} tone={r.tone} />
                            <AppText style={{ color: trendColor, fontSize: 14 }}>{r.trend}</AppText>
                          </View>
                        </View>
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function MetricCard({
  label,
  value,
  sub,
  subColor,
  c,
  dark,
}: {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  c: { primary: string; surface: string; border: string; text: string; textMuted: string; textOnInverse: string };
  dark?: boolean;
}) {
  return (
    <View style={{ width: '47%', flexGrow: 1, padding: 16, borderRadius: radius.lg, backgroundColor: dark ? c.primary : c.surface, borderWidth: dark ? 0 : 1, borderColor: c.border }}>
      <AppText style={{ fontFamily: fonts.medium, fontSize: 11, color: dark ? c.textOnInverse : c.textMuted, opacity: dark ? 0.7 : 1 }}>{label}</AppText>
      <AppText style={{ fontFamily: fonts.heading, fontSize: 22, marginTop: 4, color: dark ? c.textOnInverse : c.text }}>{value}</AppText>
      {sub ? <AppText style={{ fontFamily: fonts.medium, fontSize: 11, marginTop: 2, color: subColor ?? (dark ? c.textOnInverse : c.textMuted) }}>{sub}</AppText> : null}
    </View>
  );
}
