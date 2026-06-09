import { Image, Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { AppHeader } from '../../components/common/Brand';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SectionHeader } from '../../components/common/Section';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { formatCurrency, formatPercent, formatSigned } from '../../utils/formatters';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useListings } from '../../hooks/useListings';
import type { RootStackParamList } from '../../navigation/types';

export function PortfolioScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const c = theme.colors;
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const { properties } = useListings({ limit: 10 });
  const savedIds = usePortfolioStore((s) => s.savedIds);

  const savedHoldings = properties
    .filter((p) => savedIds.includes(p.listing_id))
    .map((p) => ({
      id: p.listing_id,
      title: p.title,
      unit: `${p.city}, ${p.district || 'Egypt'}`,
      value: p.price_egp || 0,
      changePct: 0.08,
      isNew: true,
      image: `https://via.placeholder.com/100?text=${p.city}`,
    }));

  const portfolioSummary = {
    totalValueUsd: 2500000,
    changePct: 0.15,
    avgYieldPct: 0.08,
    cashFlow: 12000,
    equityGrowth: [60, 65, 70, 75, 80, 85, 90],
    equityMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  };

  return (
    <Screen>
      <AppHeader rightIcon="notifications-outline" onBell={() => nav.navigate('Notifications')} onProfile={() => nav.navigate('Notifications')} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 20 }} showsVerticalScrollIndicator={false}>
        <View>
          <AppText style={{ fontFamily: fonts.serif, fontSize: 26, color: c.tertiary, paddingTop:10}}>{t('portfolio.title')}</AppText>
          <AppText variant="caption" color="textMuted">{t('portfolio.updated', { month })}</AppText>
        </View>

        {/* Total value */}
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1, color: c.textMuted }}>
              {t('portfolio.totalValue')}
            </AppText>
            <Badge label={`+${formatPercent(portfolioSummary.changePct)}`} tone="success" icon="arrow-up" />
          </View>
          <AppText style={{ fontFamily: fonts.heading, fontSize: 32, marginTop: 6 , paddingTop:10}}>
            {formatCurrency(portfolioSummary.totalValueUsd)}
          </AppText>
        </Card>

        {/* Yield + cash flow */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Card style={{ flex: 1 }}>
            <AppText style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 0.6, color: c.textMuted }}>
              {t('portfolio.avgYield')}
            </AppText>
            <AppText style={{ fontFamily: fonts.heading, fontSize: 22, color: c.secondary, marginTop: 4 }}>
              {formatPercent(portfolioSummary.avgYieldPct)}
            </AppText>
          </Card>
          <Card style={{ flex: 1 }}>
            <AppText style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 0.6, color: c.textMuted }}>
              {t('portfolio.cashFlow')}
            </AppText>
            <AppText style={{ fontFamily: fonts.heading, fontSize: 22, color: c.danger, marginTop: 4 }}>
              {formatSigned(portfolioSummary.cashFlow, 'USD')}
            </AppText>
          </Card>
        </View>

        {/* Equity growth chart */}
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <AppText style={{ fontFamily: fonts.semibold, fontSize: 14 }}>{t('portfolio.equityGrowth')}</AppText>
            <AppText variant="caption" color="textMuted">{t('portfolio.last6')}</AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, gap: 8 }}>
            {portfolioSummary.equityGrowth.map((v, i) => {
              const last = i === portfolioSummary.equityGrowth.length - 1;
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                  <View
                    style={{
                      width: '70%',
                      height: `${v}%`,
                      borderRadius: 6,
                      backgroundColor: last ? c.primary : c.surfaceAlt,
                    }}
                  />
                  <AppText variant="caption" color="textMuted">{portfolioSummary.equityMonths[i]}</AppText>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Holdings */}
        <View>
          <SectionHeader title={t('portfolio.holdings')} onSeeAll={() => nav.navigate('Transactions')} />
          <Card padded>
            {savedHoldings.length > 0 ? (
              savedHoldings.map((h, i) => (
                <Pressable
                  key={h.id}
                  onPress={() => nav.navigate('PropertyDetail', { id: h.id })}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 12,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: c.border,
                  }}
                >
                  <Image source={{ uri: h.image }} style={{ width: 48, height: 48, borderRadius: radius.sm }} />
                  <View style={{ flex: 1 }}>
                    <AppText style={{ fontFamily: fonts.semibold, fontSize: 14 }}>{h.title}</AppText>
                    <AppText variant="caption" color="textMuted">{h.unit}</AppText>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <AppText style={{ fontFamily: fonts.heading, fontSize: 14 }}>{formatCurrency(h.value)}</AppText>
                    {h.isNew ? (
                      <Badge label="New" tone="info" />
                    ) : (
                      <AppText style={{ fontFamily: fonts.semibold, fontSize: 12, color: c.secondary }}>
                        +{formatPercent(h.changePct)}
                      </AppText>
                    )}
                  </View>
                </Pressable>
              ))
            ) : (
              <AppText color="textMuted" style={{ textAlign: 'center', paddingVertical: 20 }}>
                {t('portfolio.noHoldings')}
              </AppText>
            )}
          </Card>
        </View>

        <Button label={t('portfolio.transactions')} variant="outlined" icon="time-outline" onPress={() => nav.navigate('Transactions')} />
      </ScrollView>
    </Screen>
  );
}