// Market Trends — live analytics from GET /market/overview.

import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/common/Screen';
import { AppText } from '../components/common/Text';
import { Card } from '../components/common/Card';
import { ScreenHeader } from '../components/common/Brand';
import { Loader } from '../components/common/Loader';
import { LineChartCard } from '../components/Chart';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radius } from '../theme/theme';
import { marketService, type MarketOverview } from '../services/api/marketService';
import { formatCompact, formatMonthShort } from '../utils/formatters';

export default function MarketScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();

  const [data, setData] = useState<MarketOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    marketService
      .overview()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader label={t('common.loading')} />;
  if (error || !data) {
    return (
      <Screen>
        <ScreenHeader title={t('market.title')} onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <AppText color="textMuted">{error ?? t('common.error')}</AppText>
        </View>
      </Screen>
    );
  }

  const maxType = Math.max(...data.byType.map((b) => b.count), 1);

  return (
    <Screen>
      <ScreenHeader title={t('market.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 18, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* KPIs */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <Kpi label={t('market.activeListings')} value={data.activeListings.toLocaleString()} c={c} />
          <Kpi label={t('market.totalValue')} value={`${formatCompact(data.totalValue)} EGP`} c={c} />
          <Kpi label={t('market.avgPrice')} value={`${formatCompact(data.avgPrice)} EGP`} c={c} />
          <Kpi label={t('market.appreciation')} value={`+${data.appreciationPct.toFixed(1)}%`} c={c} accent />
        </View>

        {/* Price/m² trend */}
        {data.trend.length > 0 && (
          <Card>
            <LineChartCard
              title={t('market.priceTrend')}
              labels={data.trend.map((p) => formatMonthShort(p.period))}
              data={data.trend.map((p) => p.medianPrice)}
              formatY={(n) => formatCompact(n)}
            />
          </Card>
        )}

        {/* Top districts */}
        <View style={{ gap: 10 }}>
          <AppText style={{ fontFamily: fonts.serif, fontSize: 20 }}>{t('market.topDistricts')}</AppText>
          <Card>
            <View style={{ gap: 14 }}>
              {data.topDistricts.map((d) => (
                <View key={d.name} style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <AppText style={{ fontFamily: fonts.medium, fontSize: 13 }}>{d.name}</AppText>
                    <AppText variant="caption" color="textMuted">{d.count.toLocaleString()} · {d.sharePct}%</AppText>
                  </View>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surfaceAlt, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.min(100, d.sharePct)}%`, height: '100%', backgroundColor: c.secondary }} />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* By type */}
        <View style={{ gap: 10 }}>
          <AppText style={{ fontFamily: fonts.serif, fontSize: 20 }}>{t('market.byType')}</AppText>
          <Card>
            <View style={{ gap: 12 }}>
              {data.byType.map((b) => (
                <View key={b.type} style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <AppText style={{ fontFamily: fonts.medium, fontSize: 13 }}>{t(`propertyType.${b.type}`)}</AppText>
                    <AppText variant="caption" color="textMuted">{b.count.toLocaleString()}</AppText>
                  </View>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surfaceAlt, overflow: 'hidden' }}>
                    <View style={{ width: `${(b.count / maxType) * 100}%`, height: '100%', backgroundColor: c.tertiary }} />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* By city */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {data.byCity.map((b) => (
            <View key={b.city} style={{ flex: 1, padding: 16, borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
              <AppText style={{ fontFamily: fonts.heading, fontSize: 20, color: c.secondary }}>{b.count.toLocaleString()}</AppText>
              <AppText variant="caption" color="textMuted">{b.city}</AppText>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Kpi({ label, value, c, accent }: { label: string; value: string; c: { surface: string; border: string; secondary: string; tertiary: string }; accent?: boolean }) {
  return (
    <View style={{ width: '47%', flexGrow: 1, padding: 16, borderRadius: radius.lg, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
      <AppText style={{ fontFamily: fonts.heading, fontSize: 19, color: accent ? c.tertiary : c.secondary }}>{value}</AppText>
      <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>{label}</AppText>
    </View>
  );
}
