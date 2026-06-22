// Property search — filters (city/area/type/beds/price) + numbered pagination.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { InlineLoader } from '../../components/common/Loader';
import { PropertyCard } from '../../components/PropertyCard';
import { Pagination } from '../../components/Pagination';
import { FilterSheet } from '../../components/property/FilterSheet';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { useWatchlistStore } from '../../store/watchlistStore';
import { propertyService } from '../../services/api/propertyService';
import { marketService } from '../../services/api/marketService';
import type { Property, PropertySearchParams } from '../../types/listing';

const PAGE_SIZE = 10;

export default function SearchScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const toggleWatch = useWatchlistStore((s) => s.toggle);
  const entries = useWatchlistStore((s) => s.entries);
  const loadWatch = useWatchlistStore((s) => s.load);

  const [filters, setFilters] = useState<PropertySearchParams>({ page: 1, pageSize: PAGE_SIZE });
  const [items, setItems] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [towns, setTowns] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);

  const filterKey = JSON.stringify(filters);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await propertyService.search(filters);
      setItems(page.items);
      setTotal(page.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
      setItems([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, t]);

  useEffect(() => { void runSearch(); }, [runSearch]);
  useEffect(() => { void loadWatch(); }, [loadWatch]);

  // Areas depend on the selected city; types come from the live market overview.
  useEffect(() => {
    propertyService.getTowns(filters.city).then(setTowns).catch(() => setTowns([]));
  }, [filters.city]);
  useEffect(() => {
    marketService.overview().then((m) => setAvailableTypes(m.byType.map((b) => b.type))).catch(() => {});
  }, []);

  const applyPatch = (patch: PropertySearchParams) => setFilters((f) => ({ ...f, ...patch, page: 1 }));
  const resetFilters = () => setFilters({ page: 1, pageSize: PAGE_SIZE });
  const setPage = (page: number) => setFilters((f) => ({ ...f, page }));

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeCount = useMemo(
    () => ['city', 'district', 'type', 'bedrooms', 'minPrice', 'maxPrice'].filter((k) => filters[k as keyof PropertySearchParams] != null).length,
    [filters],
  );

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (filters.city) chips.push({ key: 'city', label: filters.city, clear: () => applyPatch({ city: undefined, district: undefined }) });
    if (filters.district) chips.push({ key: 'district', label: filters.district, clear: () => applyPatch({ district: undefined }) });
    if (filters.type) chips.push({ key: 'type', label: t(`propertyType.${filters.type}`), clear: () => applyPatch({ type: undefined }) });
    if (filters.bedrooms != null) chips.push({ key: 'beds', label: `${filters.bedrooms}+ ${t('search.beds')}`, clear: () => applyPatch({ bedrooms: undefined }) });
    if (filters.minPrice != null) chips.push({ key: 'min', label: `≥ ${filters.minPrice.toLocaleString()}`, clear: () => applyPatch({ minPrice: undefined }) });
    if (filters.maxPrice != null) chips.push({ key: 'max', label: `≤ ${filters.maxPrice.toLocaleString()}`, clear: () => applyPatch({ maxPrice: undefined }) });
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, t]);

  return (
    <Screen>
      <FlatList
        data={loading ? [] : items}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PropertyCard property={item} watched={entries.some((e) => e.propertyId === item.id)} onToggleWatch={toggleWatch} />
        )}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 4 }}>
            <View>
              <AppText style={{ fontFamily: fonts.serif, fontSize: 26 }}>{t('search.title')}</AppText>
              <AppText color="textMuted">{t('search.subtitle', { count: total })}</AppText>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => setSheet(true)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, height: 46, borderRadius: radius.md, backgroundColor: c.primary }}
              >
                <Ionicons name="options-outline" size={18} color={c.textOnPrimary} />
                <AppText style={{ fontFamily: fonts.semibold, color: c.textOnPrimary }}>{t('search.filtersTitle')}</AppText>
                {activeCount > 0 && (
                  <View style={{ minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: c.secondary, alignItems: 'center', justifyContent: 'center' }}>
                    <AppText style={{ color: '#fff', fontFamily: fonts.semibold, fontSize: 11 }}>{activeCount}</AppText>
                  </View>
                )}
              </Pressable>
              {activeCount > 0 && (
                <Pressable onPress={resetFilters} style={{ justifyContent: 'center', paddingHorizontal: 8 }}>
                  <AppText color="secondary" style={{ fontFamily: fonts.medium }}>{t('search.reset')}</AppText>
                </Pressable>
              )}
            </View>

            {activeChips.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {activeChips.map((chip) => (
                  <Pressable key={chip.key} onPress={chip.clear} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: c.secondaryMuted }}>
                    <AppText variant="caption" style={{ color: c.secondary, fontFamily: fonts.medium }}>{chip.label}</AppText>
                    <Ionicons name="close" size={13} color={c.secondary} />
                  </Pressable>
                ))}
              </View>
            )}

            {loading && <InlineLoader />}
            {error && <AppText variant="caption" color="danger">{error}</AppText>}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 48, gap: 10 }}>
              <Ionicons name="home-outline" size={40} color={c.textMuted} />
              <AppText color="textMuted" center>{t('search.noResults')}</AppText>
            </View>
          ) : null
        }
        ListFooterComponent={
          !loading && items.length > 0 ? <Pagination page={filters.page ?? 1} pageCount={pageCount} onChange={setPage} /> : null
        }
      />

      <FilterSheet
        visible={sheet}
        filters={filters}
        towns={towns}
        availableTypes={availableTypes}
        onApply={applyPatch}
        onReset={resetFilters}
        onClose={() => setSheet(false)}
      />
    </Screen>
  );
}
