// Portfolio / Watchlist — saved properties + AI Compare (select 2-4).

import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { PropertyCard } from '../../components/PropertyCard';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { useWatchlistStore } from '../../store/watchlistStore';
import { formatCompact } from '../../utils/formatters';

export default function PortfolioScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();

  const entries = useWatchlistStore((s) => s.entries);
  const loading = useWatchlistStore((s) => s.loading);
  const load = useWatchlistStore((s) => s.load);
  const toggleWatch = useWatchlistStore((s) => s.toggle);

  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => { void load(); }, [load]);

  const totalValue = useMemo(
    () => entries.reduce((sum, e) => sum + (e.property?.price ?? 0), 0),
    [entries],
  );

  const toggleSelect = (propertyId: string) => {
    setSelected((prev) =>
      prev.includes(propertyId) ? prev.filter((x) => x !== propertyId) : prev.length < 4 ? [...prev, propertyId] : prev,
    );
  };

  const startCompare = () => {
    router.push({ pathname: '/compare', params: { ids: selected.join(',') } });
  };

  const withProperty = entries.filter((e) => e.property);

  return (
    <Screen>
      <FlatList
        data={withProperty}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={c.secondary} />}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <AppText style={{ fontFamily: fonts.serif, fontSize: 26 }}>{t('portfolio.title')}</AppText>
                <AppText color="textMuted">{t('portfolio.count', { count: withProperty.length })}</AppText>
              </View>
              {withProperty.length >= 2 && (
                <Pressable
                  onPress={() => { setCompareMode((v) => !v); setSelected([]); }}
                  style={{ paddingHorizontal: 14, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: compareMode ? c.secondary : c.border, backgroundColor: compareMode ? c.secondaryMuted : c.surface, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <Ionicons name="git-compare-outline" size={16} color={compareMode ? c.secondary : c.text} />
                  <AppText style={{ fontFamily: fonts.medium, color: compareMode ? c.secondary : c.text }}>{t('portfolio.compare')}</AppText>
                </Pressable>
              )}
            </View>

            {withProperty.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: c.primary }}>
                <Stat label={t('portfolio.totalValue')} value={`${formatCompact(totalValue)} EGP`} c={c} />
                <Stat label={t('portfolio.holdings')} value={String(withProperty.length)} c={c} />
              </View>
            )}

            {compareMode && (
              <AppText variant="caption" color="textMuted">{t('portfolio.selectHint', { count: selected.length })}</AppText>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => compareMode && item.property && toggleSelect(item.property.id)} disabled={!compareMode}>
            <View style={{ position: 'relative' }}>
              <PropertyCard property={item.property!} watched onToggleWatch={!compareMode ? toggleWatch : undefined} />
              {compareMode && (
                <View style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 14, backgroundColor: selected.includes(item.property!.id) ? c.secondary : 'rgba(10,22,40,0.55)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' }}>
                  {selected.includes(item.property!.id) && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              )}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 56, gap: 12 }}>
              <Ionicons name="briefcase-outline" size={44} color={c.textMuted} />
              <AppText color="textMuted" center>{t('portfolio.empty')}</AppText>
              <Button label={t('portfolio.explore')} fullWidth={false} onPress={() => router.push('/search')} />
            </View>
          ) : null
        }
      />

      {compareMode && selected.length >= 2 && (
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: 20 }}>
          <Button label={t('portfolio.compareN', { count: selected.length })} icon="sparkles" onPress={startCompare} />
        </View>
      )}
    </Screen>
  );
}

function Stat({ label, value, c }: { label: string; value: string; c: { textOnInverse: string; secondary: string } }) {
  return (
    <View style={{ flex: 1 }}>
      <AppText style={{ fontFamily: fonts.heading, fontSize: 18, color: c.textOnInverse }}>{value}</AppText>
      <AppText style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 0.5, color: c.textOnInverse, opacity: 0.7, marginTop: 2 }}>{label.toUpperCase()}</AppText>
    </View>
  );
}
