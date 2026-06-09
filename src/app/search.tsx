import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, FlatList, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes } from '../constants/colors';
import { BottomNav } from '../components/BottomNav';
import { useListings } from '../hooks/useListings';
import { Property, SearchParams } from '../types/listing';

const OFFERING_FILTERS = [
  { label: 'For Sale', key: 'offering_type' as const, value: 'for_sale' },
  { label: 'For Rent', key: 'offering_type' as const, value: 'for_rent' },
];

const TYPE_FILTERS = [
  { label: 'Apartment',   key: 'property_type' as const, value: 'Apartment' },
  { label: 'Villa',       key: 'property_type' as const, value: 'Villa' },
  { label: 'Townhouse',   key: 'property_type' as const, value: 'Townhouse' },
  { label: 'Duplex',      key: 'property_type' as const, value: 'Duplex' },
  { label: 'Penthouse',   key: 'property_type' as const, value: 'Penthouse' },
  { label: 'Chalet',      key: 'property_type' as const, value: 'Chalet' },
];

const CITY_FILTERS = [
  { label: 'Cairo',       key: 'city' as const, value: 'Cairo' },
  { label: 'Giza',        key: 'city' as const, value: 'Giza' },
  { label: 'North Coast', key: 'city' as const, value: 'North Coast' },
  { label: 'Red Sea',     key: 'city' as const, value: 'Red Sea' },
];

const STATUS_FILTERS = [
  { label: 'Completed',    key: 'completion_status' as const, value: 'completed' },
  { label: 'Off Plan',     key: 'completion_status' as const, value: 'off_plan' },
  { label: 'Off Plan Pri', key: 'completion_status' as const, value: 'off_plan_primary' },
];

type FilterKey = 'offering_type' | 'property_type' | 'city' | 'completion_status';

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<FilterKey, string | null>>({
    offering_type: null,
    property_type: null,
    city: null,
    completion_status: null,
  });
  const [searchParams, setSearchParams] = useState<SearchParams>({ limit: 20 });

  const { properties, loading, error, refresh, loadMore, hasMore, total } =
    useListings(searchParams);

  const handleFilterPress = (key: FilterKey, value: string) => {
    const isActive = activeFilters[key] === value;
    const newFilters = { ...activeFilters, [key]: isActive ? null : value };
    setActiveFilters(newFilters);

    const newParams: SearchParams = { limit: 20 };
    if (newFilters.offering_type) newParams.offering_type = newFilters.offering_type as any;
    if (newFilters.property_type) newParams.property_type = newFilters.property_type;
    if (newFilters.city)          newParams.city = newFilters.city;
    if (newFilters.completion_status) newParams.completion_status = newFilters.completion_status;
    if (searchQuery.trim())       newParams.search = searchQuery;
    setSearchParams(newParams);
  };

  const handleSearch = () => {
    setSearchParams(prev => ({
      ...prev,
      search: searchQuery.trim() || undefined,
    }));
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchParams(prev => { const p = { ...prev }; delete p.search; return p; });
  };

  const formatPrice = (price?: number) => {
    if (!price) return '—';
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M EGP`;
    if (price >= 1_000)     return `${(price / 1_000).toFixed(0)}K EGP`;
    return `${price.toLocaleString()} EGP`;
  };

  const renderPropertyCard = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      activeOpacity={0.85}
      onPress={() =>
        router.push({ pathname: '/property/[id]', params: { id: item.listing_id } })
      }
    >
      {/* Image placeholder */}
      <View style={styles.propertyImage}>
        <MaterialIcons name="home" size={60} color={Colors.onSurfaceVariant} />

        <View style={styles.listingBadge}>
          <Text style={styles.listingBadgeText}>
            {item.offering_type === 'Residential for Sale' ? 'FOR SALE' : 'FOR RENT'}
          </Text>
        </View>

        {item.is_premium && (
          <View style={styles.premiumBadge}>
            <MaterialIcons name="star" size={12} color="#fff" />
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        )}

        {item.is_verified && (
          <View style={styles.verifiedBadge}>
            <MaterialIcons name="verified" size={12} color={Colors.secondary} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>

      <View style={styles.propertyContent}>
        {/* Title */}
        <Text style={styles.propertyTitle} numberOfLines={2}>
          {item.title || item.property_type || 'Property'}
        </Text>

        {/* Location */}
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={14} color={Colors.onSurfaceVariant} />
          <Text style={styles.propertyLocationText} numberOfLines={1}>
            {[item.district, item.town, item.city].filter(Boolean).join(', ')}
          </Text>
        </View>

        {/* Price + specs */}
        <View style={styles.propertyFooter}>
          <Text style={styles.propertyPrice}>{formatPrice(item.price_egp)}</Text>
          <View style={styles.propertyFeatures}>
            {!!item.bedrooms && (
              <View style={styles.feature}>
                <MaterialIcons name="bed" size={14} color={Colors.onSurfaceVariant} />
                <Text style={styles.featureText}>{item.bedrooms}</Text>
              </View>
            )}
            {!!item.bathrooms && (
              <View style={styles.feature}>
                <MaterialIcons name="bathtub" size={14} color={Colors.onSurfaceVariant} />
                <Text style={styles.featureText}>{item.bathrooms}</Text>
              </View>
            )}
            {!!item.area_value && (
              <View style={styles.feature}>
                <MaterialIcons name="straighten" size={14} color={Colors.onSurfaceVariant} />
                <Text style={styles.featureText}>{item.area_value}m²</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tagsRow}>
          {item.property_type && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.property_type}</Text>
            </View>
          )}
          {item.completion_status && (
            <View style={[styles.tag, { backgroundColor: Colors.secondaryContainer + '30' }]}>
              <Text style={[styles.tagText, { color: Colors.secondary }]}>
                {item.completion_status.replace(/_/g, ' ')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const FilterChip = ({
    label, filterKey, value,
  }: { label: string; filterKey: FilterKey; value: string }) => {
    const isActive = activeFilters[filterKey] === value;
    return (
      <TouchableOpacity
        style={[styles.filterChip, isActive && styles.activeFilterChip]}
        onPress={() => handleFilterPress(filterKey, value)}
      >
        <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <MaterialIcons name="search" size={24} color={Colors.onSurfaceVariant} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by title, city, district..."
                placeholderTextColor={Colors.onSurfaceVariant}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch}>
                  <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
              )}
            </View>

            {/* Offering type */}
            <Text style={styles.filterGroupLabel}>Listing Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
              {OFFERING_FILTERS.map(f => (
                <FilterChip key={f.value} label={f.label} filterKey={f.key} value={f.value} />
              ))}
            </ScrollView>

            {/* Property type */}
            <Text style={styles.filterGroupLabel}>Property Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
              {TYPE_FILTERS.map(f => (
                <FilterChip key={f.value} label={f.label} filterKey={f.key} value={f.value} />
              ))}
            </ScrollView>

            {/* City */}
            <Text style={styles.filterGroupLabel}>City</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
              {CITY_FILTERS.map(f => (
                <FilterChip key={f.value} label={f.label} filterKey={f.key} value={f.value} />
              ))}
            </ScrollView>

            {/* Status */}
            <Text style={styles.filterGroupLabel}>Completion</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
              {STATUS_FILTERS.map(f => (
                <FilterChip key={f.value} label={f.label} filterKey={f.key} value={f.value} />
              ))}
            </ScrollView>
          </View>

          {/* Results header */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Results</Text>
            <Text style={styles.resultsCount}>
              {loading ? 'Searching...' : `${total.toLocaleString()} properties found`}
            </Text>
          </View>

          {/* Results */}
          {loading && properties.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.secondary} />
              <Text style={styles.loadingText}>Searching properties...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={40} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={refresh}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : properties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={60} color={Colors.onSurfaceVariant} />
              <Text style={styles.emptyText}>No properties found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
            </View>
          ) : (
            <FlatList
              data={properties}
              renderItem={renderPropertyCard}
              keyExtractor={(item, index) => `${item.listing_id}-${index}`}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
              contentContainerStyle={{ paddingHorizontal: Spacing.mobileMargin }}
              onEndReached={hasMore ? loadMore : undefined}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loading && properties.length > 0 ? (
                  <View style={styles.loadingMore}>
                    <ActivityIndicator size="small" color={Colors.secondary} />
                  </View>
                ) : null
              }
            />
          )}
        </ScrollView>

        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },

  searchContainer: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.mobileMargin,
    gap: Spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSizes.bodyMD, color: Colors.onSurface },

  filterGroupLabel: {
    fontSize: FontSizes.labelSM,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  filtersContainer: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 20,
  },
  activeFilterChip: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: FontSizes.labelMD, fontWeight: '600', color: Colors.onSurfaceVariant },
  activeFilterText: { color: Colors.onPrimary },

  resultsHeader: {
    paddingHorizontal: Spacing.mobileMargin,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  resultsTitle: { fontSize: FontSizes.headlineLG, fontWeight: '600', color: Colors.onSurface },
  resultsCount: { fontSize: FontSizes.bodySM, color: Colors.onSurfaceVariant, marginTop: Spacing.xs },

  loadingContainer: { alignItems: 'center', paddingVertical: Spacing.xl * 2, gap: Spacing.md },
  loadingText: { fontSize: FontSizes.bodyMD, color: Colors.onSurfaceVariant },

  errorContainer: { alignItems: 'center', paddingVertical: Spacing.xl * 2, gap: Spacing.md },
  errorText: { fontSize: FontSizes.bodyMD, color: Colors.error, textAlign: 'center' },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  retryText: { color: Colors.onPrimary, fontSize: FontSizes.labelMD, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xl * 2, gap: Spacing.sm },
  emptyText: { fontSize: FontSizes.headlineSM, color: Colors.onSurface, fontWeight: '600' },
  emptySubtext: { fontSize: FontSizes.bodyMD, color: Colors.onSurfaceVariant },

  loadingMore: { paddingVertical: Spacing.lg, alignItems: 'center' },

  // Property card
  propertyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  propertyImage: {
    height: 200,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingBadge: {
    position: 'absolute', top: Spacing.md, left: Spacing.md,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  listingBadgeText: { fontSize: FontSizes.labelSM, fontWeight: '700', color: Colors.onSurface },
  premiumBadge: {
    position: 'absolute', top: Spacing.md, right: Spacing.md,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  premiumText: { fontSize: FontSizes.labelSM, fontWeight: '700', color: '#fff' },
  verifiedBadge: {
    position: 'absolute', bottom: Spacing.md, right: Spacing.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  verifiedText: { fontSize: FontSizes.labelSM, fontWeight: '600', color: Colors.secondary },

  propertyContent: { padding: Spacing.md, gap: Spacing.xs },
  propertyTitle: { fontSize: FontSizes.headlineSM, fontWeight: '600', color: Colors.onSurface },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  propertyLocationText: { fontSize: FontSizes.bodySM, color: Colors.onSurfaceVariant, flex: 1 },

  propertyFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: Spacing.xs,
  },
  propertyPrice: { fontSize: FontSizes.headlineSM, fontWeight: '700', color: Colors.secondary },
  propertyFeatures: { flexDirection: 'row', gap: Spacing.sm },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  featureText: { fontSize: FontSizes.labelSM, color: Colors.onSurfaceVariant },

  tagsRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xs, flexWrap: 'wrap' },
  tag: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: 6,
  },
  tagText: { fontSize: FontSizes.labelSM, color: Colors.onSurfaceVariant },
});