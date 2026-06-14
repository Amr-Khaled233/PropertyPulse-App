// AI Compare — ranks 2-4 selected properties (POST /analysis/compare).

import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/common/Screen';
import { AppText } from '../components/common/Text';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ScreenHeader } from '../components/common/Brand';
import { AiLoader } from '../components/common/AiLoader';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radius } from '../theme/theme';
import { useUiStore } from '../store/uiStore';
import { analysisService, type ComparisonResult } from '../services/api/analysisService';
import { formatCompactCurrency, formatPct } from '../utils/formatters';
import { displayTitle } from '../utils/propertyTitle';

function cleanText(text: string, candidates: ComparisonCandidate[]): string {
  let t = text;
  for (const cand of candidates) {
    const title = displayTitle(cand.property);
    t = t.replace(new RegExp(`\\(ID:\\s*${cand.property.id}\\)`, 'g'), '');
    t = t.replace(new RegExp(cand.property.id, 'g'), title);
  }
  return t.replace(/\s{2,}/g, ' ').trim();
}

export default function CompareScreen() {
  const { ids } = useLocalSearchParams<{ ids: string }>();
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();
  const lang = useUiStore((s) => s.language);

  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; isLimit: boolean } | null>(null);

  const propertyIds = (ids ?? '').split(',').filter(Boolean);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      setResult(await analysisService.compare(propertyIds, lang));
    } catch (e) {
      const isLimit = (e as { code?: string }).code === 'COMPARE_LIMIT_REACHED';
      setError({ message: e instanceof Error ? e.message : t('common.error'), isLimit });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void run(); /* eslint-disable-next-line */ }, [ids]);

  const rankOf = (id: string) => result?.ranking?.find((r) => r.propertyId === id)?.rank;

  return (
    <Screen>
      <ScreenHeader title={t('compare.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <AiLoader title={t('compare.analyzing')} />
        ) : error ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 14 }}>
            <Ionicons name={error.isLimit ? 'lock-closed-outline' : 'alert-circle-outline'} size={40} color={error.isLimit ? c.tertiary : c.danger} />
            {error.isLimit && (
              <AppText style={{ fontFamily: fonts.serif, fontSize: 18 }} center>{t('compare.limitTitle')}</AppText>
            )}
            <AppText color="textMuted" center>{error.isLimit ? t('compare.limitBody') : error.message}</AppText>
            {error.isLimit ? (
              <>
                <Button label={t('compare.upgrade')} onPress={() => router.push('/pricing')} fullWidth={false} />
                <Button label={t('common.back')} variant="outlined" onPress={() => router.back()} fullWidth={false} />
              </>
            ) : (
              <Button label={t('common.retry')} variant="outlined" onPress={run} fullWidth={false} />
            )}
          </View>
        ) : result ? (
          <>
            <Card tone="inverse">
              <AppText variant="label" style={{ color: c.textOnInverse, opacity: 0.7 }}>{t('compare.verdict')}</AppText>
              <AppText style={{ color: c.textOnInverse, marginTop: 6, lineHeight: 22 }}>{cleanText(result.verdict, result.candidates)}</AppText>
            </Card>

            {[...result.candidates]
              .sort((a, b) => (rankOf(a.property.id) ?? 99) - (rankOf(b.property.id) ?? 99))
              .map((cand) => {
                const rank = rankOf(cand.property.id);
                const rationale = result.ranking?.find((r) => r.propertyId === cand.property.id)?.rationale;
                const isTop = rank === 1;
                return (
                  <Card key={cand.property.id} style={isTop ? { borderColor: c.secondary, borderWidth: 1.5 } : undefined}>
                    {/* Header row: rank badge + title + recommendation */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          {rank && (
                            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: isTop ? c.secondary : c.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                              <AppText style={{ fontFamily: fonts.heading, fontSize: 12, color: isTop ? '#fff' : c.text }}>{rank}</AppText>
                            </View>
                          )}
                          <AppText numberOfLines={1} style={{ fontFamily: fonts.semibold, fontSize: 15, flex: 1 }}>{displayTitle(cand.property)}</AppText>
                        </View>
                      </View>
                      <Badge label={cand.recommendation} tone={cand.recommendation === 'buy' ? 'success' : cand.recommendation === 'avoid' ? 'danger' : 'warning'} solid />
                    </View>

                    {/* Price + property meta */}
                    <AppText color="secondary" style={{ fontFamily: fonts.serif, fontSize: 20, marginBottom: 4 }}>
                      {formatCompactCurrency(cand.property.price, cand.property.currency)}
                    </AppText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                      {cand.property.type && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="home-outline" size={12} color={c.textMuted} />
                          <AppText variant="caption" color="textMuted" style={{ textTransform: 'capitalize' }}>{cand.property.type.replace(/_/g, ' ')}</AppText>
                        </View>
                      )}
                      {cand.property.areaSqm > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="resize-outline" size={12} color={c.textMuted} />
                          <AppText variant="caption" color="textMuted">{cand.property.areaSqm} m²</AppText>
                        </View>
                      )}
                      {cand.property.bedrooms > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="bed-outline" size={12} color={c.textMuted} />
                          <AppText variant="caption" color="textMuted">{cand.property.bedrooms} bed</AppText>
                        </View>
                      )}
                      {cand.property.address?.city && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="location-outline" size={12} color={c.textMuted} />
                          <AppText variant="caption" color="textMuted">{cand.property.address.city}</AppText>
                        </View>
                      )}
                    </View>

                    {/* Financial metrics */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.border }}>
                      <Cell label={t('report.netYield')} value={formatPct(cand.metrics.netRentalYield)} highlight={isTop} />
                      <Cell label={t('report.fiveYearRoi')} value={formatPct(cand.metrics.fiveYearRoi)} highlight={isTop} />
                      <Cell label={t('report.cashOnCash')} value={formatPct(cand.metrics.cashOnCashReturn)} />
                      <Cell label={t('compare.pricePerSqm')} value={cand.pricePerSqm.toLocaleString()} />
                    </View>

                    {/* AI Reasoning */}
                    {rationale && (
                      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border, gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="bulb-outline" size={14} color={c.secondary} />
                          <AppText variant="label" color="secondary">AI Reasoning</AppText>
                        </View>
                        {cleanText(rationale, result.candidates)
                          .split(/\n|(?<=\.\s)/)
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((sentence, i) => (
                            <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                              <Ionicons name="ellipse" size={6} color={c.secondary} style={{ marginTop: 7 }} />
                              <AppText color="textSecondary" style={{ flex: 1, fontSize: 13, lineHeight: 20 }}>{sentence}</AppText>
                            </View>
                          ))}
                      </View>
                    )}
                  </Card>
                );
              })}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Cell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={{ minWidth: '44%' }}>
      <AppText style={{ fontFamily: fonts.heading, fontSize: 15, color: highlight ? theme.colors.secondary : theme.colors.text }}>{value}</AppText>
      <AppText variant="caption" color="textMuted">{label}</AppText>
    </View>
  );
}
