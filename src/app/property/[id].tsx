// Property detail — hero, specs, investment snapshot, AI actions, inquiry.

import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { InquiryModal } from '../../components/property/InquiryModal';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { useWatchlistStore } from '../../store/watchlistStore';
import { useUiStore } from '../../store/uiStore';
import { propertyService } from '../../services/api/propertyService';
import { propertyImage } from '../../utils/propertyImages';
import { displayTitle } from '../../utils/propertyTitle';
import { formatCompactCurrency, formatPct } from '../../utils/formatters';
import { buildAssumptions, computeInvestmentMetrics, estimateMonthlyRent } from '../../utils/financial';
import type { Property } from '../../types/listing';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();
  const lang = useUiStore((s) => s.language);

  const isWatched = useWatchlistStore((s) => s.entries.some((e) => e.propertyId === id));
  const toggleWatch = useWatchlistStore((s) => s.toggle);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inquiry, setInquiry] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    propertyService
      .getById(id, lang)
      .then(setProperty)
      .catch((e) => setError(e instanceof Error ? e.message : 'Not found'))
      .finally(() => setLoading(false));
  }, [id, lang]);

  const metrics = useMemo(() => {
    if (!property) return null;
    const a = buildAssumptions(property.price, { monthlyRent: estimateMonthlyRent(property.areaSqm, property.type) });
    return computeInvestmentMetrics(a);
  }, [property]);

  if (loading) return <Loader label={t('common.loading')} />;
  if (error || !property) {
    return (
      <Screen padded>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Ionicons name="alert-circle-outline" size={40} color={c.danger} />
          <AppText color="textMuted">{error ?? t('common.error')}</AppText>
          <Button label={t('common.back')} variant="outlined" fullWidth={false} onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const pricePerSqm = property.areaSqm > 0 ? Math.round(property.price / property.areaSqm) : 0;

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ height: 280, backgroundColor: c.primary }}>
          <Image source={{ uri: propertyImage(property) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between', padding: 16, paddingTop: 52 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <RoundBtn icon="arrow-back" onPress={() => router.back()} />
              <RoundBtn icon={isWatched ? 'star' : 'star-outline'} active={isWatched} onPress={() => toggleWatch(property.id)} />
            </View>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Badge label={t(`propertyType.${property.type}`)} tone="info" solid />
                <Badge label={property.status === 'for_rent' ? t('common.forRent') : t('common.forSale')} tone="success" solid />
              </View>
              <AppText style={{ fontFamily: fonts.serif, fontSize: 28, color: '#fff' }}>
                {formatCompactCurrency(property.price, property.currency)}
              </AppText>
            </View>
          </View>
        </View>

        <View style={{ padding: 20, gap: 18 }}>
          <View>
            <AppText style={{ fontFamily: fonts.serif, fontSize: 22 }}>{displayTitle(property)}</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <Ionicons name="location-outline" size={15} color={c.textMuted} />
              <AppText color="textMuted">{[property.address?.line1, property.address?.city].filter(Boolean).join(', ')}</AppText>
            </View>
          </View>

          {/* Specs */}
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <Spec icon="bed-outline" label={t('detail.beds')} value={property.bedrooms} />
              <Spec icon="water-outline" label={t('detail.baths')} value={property.bathrooms} />
              <Spec icon="resize-outline" label={t('detail.area')} value={`${property.areaSqm} m²`} />
              {property.yearBuilt ? <Spec icon="calendar-outline" label={t('detail.year')} value={property.yearBuilt} /> : null}
            </View>
          </Card>

          {/* Investment snapshot */}
          <View style={{ gap: 10 }}>
            <AppText style={{ fontFamily: fonts.serif, fontSize: 20, color: c.tertiary }}>{t('detail.investmentSnapshot')}</AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Metric label={t('detail.netYield')} value={formatPct(metrics?.netRentalYield ?? 0)} c={c} />
              <Metric label={t('detail.fiveYearRoi')} value={formatPct(metrics?.fiveYearRoi ?? 0)} c={c} accent />
              <Metric label={t('detail.cashOnCash')} value={formatPct(metrics?.cashOnCashReturn ?? 0)} c={c} />
              <Metric label={t('detail.pricePerSqm')} value={`${pricePerSqm.toLocaleString()} ${property.currency}`} c={c} />
            </View>
          </View>

          {/* Actions */}
          <View style={{ gap: 10 }}>
            <Button label={t('detail.runAiAnalysis')} icon="sparkles" onPress={() => router.push(`/analysis/${property.id}`)} />
            <Button label={t('detail.generateReport')} variant="inverted" icon="document-text-outline" onPress={() => router.push(`/report/${property.id}`)} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label={t('detail.contact')} variant="outlined" fullWidth={false} style={{ flex: 1 }} onPress={() => setInquiry(true)} />
              <Button
                label={isWatched ? t('detail.inPortfolio') : t('detail.addToPortfolio')}
                variant="secondary"
                fullWidth={false}
                style={{ flex: 1 }}
                onPress={() => toggleWatch(property.id)}
              />
            </View>
          </View>

          {property.description ? (
            <View style={{ gap: 8 }}>
              <AppText style={{ fontFamily: fonts.serif, fontSize: 20 }}>{t('detail.about')}</AppText>
              <AppText color="textSecondary" style={{ lineHeight: 22 }}>{property.description}</AppText>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <InquiryModal visible={inquiry} propertyId={property.id} onClose={() => setInquiry(false)} />
    </Screen>
  );
}

function RoundBtn({ icon, onPress, active }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; active?: boolean }) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(10,22,40,0.55)', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={20} color={active ? theme.colors.star : '#fff'} />
    </Pressable>
  );
}

function Spec({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string | number }) {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={20} color={theme.colors.secondary} />
      <AppText style={{ fontFamily: fonts.semibold, fontSize: 15 }}>{value}</AppText>
      <AppText variant="caption" color="textMuted">{label}</AppText>
    </View>
  );
}

function Metric({ label, value, c, accent }: { label: string; value: string; c: { surface: string; border: string; secondary: string; tertiary: string }; accent?: boolean }) {
  return (
    <View style={{ width: '47%', flexGrow: 1, padding: 14, borderRadius: radius.md, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
      <AppText style={{ fontFamily: fonts.heading, fontSize: 20, color: accent ? c.tertiary : c.secondary }}>{value}</AppText>
      <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>{label}</AppText>
    </View>
  );
}
