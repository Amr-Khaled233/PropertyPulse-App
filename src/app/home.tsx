import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes } from '../constants/colors';
import { BottomNav } from '../components/BottomNav';
import { useListings } from '../hooks/useListings';
import { Property } from '../types/listing';

export default function HomeScreen() {
  const router = useRouter();
  const { properties, loading, error, refresh } = useListings({
    offering_type: 'for_sale',
    limit: 10,
  });

  const formatPrice = (price: number | undefined) => {
    if (!price) return '—';
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M EGP`;
    if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K EGP`;
    return `${price.toLocaleString()} EGP`;
  };

  const renderPropertyCard = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: '/property/[id]',
          params: { id: item.listing_id },
        })
      }
    >
      {/* Image placeholder */}
      <View style={styles.propertyImage}>
        <MaterialIcons name="home" size={40} color={Colors.onSurfaceVariant} />

        {/* Offering type badge */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {item.offering_type === 'Residential for Sale' ? 'FOR SALE' : 'FOR RENT'}
          </Text>
        </View>

        {/* Premium badge */}
        {item.is_premium && (
          <View style={styles.premiumBadge}>
            <MaterialIcons name="star" size={12} color="#fff" />
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        )}
      </View>

      <View style={styles.propertyContent}>
        {/* Title */}
        <Text style={styles.propertyTitle} numberOfLines={1}>
          {item.title || `${item.property_type ?? 'Property'}`}
        </Text>

        {/* Location */}
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={14} color={Colors.onSurfaceVariant} />
          <Text style={styles.propertyLocation} numberOfLines={1}>
            {[item.district, item.town, item.city].filter(Boolean).join(', ')}
          </Text>
        </View>

        <View style={styles.propertyFooter}>
          {/* Price */}
          <Text style={styles.propertyPrice}>{formatPrice(item.price_egp)}</Text>

          {/* Specs */}
          <View style={styles.propertyBadges}>
            {!!item.bedrooms && (
              <View style={styles.badge}>
                <MaterialIcons name="bed" size={13} color={Colors.onSurfaceVariant} />
                <Text style={styles.badgeText}>{item.bedrooms}</Text>
              </View>
            )}
            {!!item.bathrooms && (
              <View style={styles.badge}>
                <MaterialIcons name="bathtub" size={13} color={Colors.onSurfaceVariant} />
                <Text style={styles.badgeText}>{item.bathrooms}</Text>
              </View>
            )}
            {!!item.area_value && (
              <View style={styles.badge}>
                <MaterialIcons name="straighten" size={13} color={Colors.onSurfaceVariant} />
                <Text style={styles.badgeText}>{item.area_value}m²</Text>
              </View>
            )}
          </View>
        </View>

        {/* Property type + completion */}
        <View style={styles.tagsRow}>
          {item.property_type && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.property_type}</Text>
            </View>
          )}
          {item.completion_status && (
            <View style={[styles.tag, { backgroundColor: Colors.secondaryContainer + '40' }]}>
              <Text style={[styles.tagText, { color: Colors.secondary }]}>
                {item.completion_status.replace(/_/g, ' ')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.greetingText}>Good Morning, Ahmed</Text>
          </View>

          {/* Portfolio Card */}
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Portfolio Value</Text>
            <Text style={styles.valueText}>24.8M EGP</Text>
            <View style={styles.growthBadge}>
              <MaterialIcons name="trending-up" size={16} color={Colors.onSurface} />
              <Text style={styles.growthText}>+12.4%</Text>
            </View>
          </View>

          {/* AI Insight */}
          <View style={styles.aiCard}>
            <Text style={styles.aiLabel}>AI INSIGHT</Text>
            <Text style={styles.aiText}>
              Properties in Cairo show strong demand this quarter. Off-plan listings in New Cairo offer the highest yield potential.
            </Text>
          </View>

          {/* Market Trends Button */}
          <TouchableOpacity
            style={styles.marketButton}
            onPress={() => router.push('/market/trends' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.marketButtonContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.marketButtonTitle}>Egyptian Market Trends</Text>
                <Text style={styles.marketButtonSubtitle}>
                  View price appreciation, inventory levels & AI analysis
                </Text>
              </View>
              <MaterialIcons name="trending-up" size={28} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Latest Properties */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Properties</Text>
              <TouchableOpacity onPress={refresh} style={styles.refreshBtn}>
                <MaterialIcons name="refresh" size={20} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {loading && properties.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.secondary} />
                <Text style={styles.loadingText}>Loading properties...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={40} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={refresh}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={properties}
                renderItem={renderPropertyCard}
              keyExtractor={(item, index) => `${item.listing_id}-${index}`}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
              />
            )}
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: 100 },

  header: {
    paddingHorizontal: Spacing.mobileMargin,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  welcomeText: {
    fontSize: FontSizes.labelMD,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  greetingText: {
    fontSize: FontSizes.headlineLG,
    fontWeight: '600',
    color: Colors.onSurface,
  },

  statsCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.mobileMargin,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  statsLabel: {
    fontSize: FontSizes.labelMD,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  valueText: {
    fontSize: FontSizes.headlineXL,
    fontWeight: '600',
    color: Colors.onSurface,
    marginTop: Spacing.xs,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    gap: Spacing.xs,
  },
  growthText: {
    fontSize: FontSizes.labelMD,
    fontWeight: '700',
    color: Colors.onSurface,
  },

  aiCard: {
    backgroundColor: Colors.darkBackground,
    marginHorizontal: Spacing.mobileMargin,
    padding: Spacing.lg,
    borderRadius: 12,
  },
  aiLabel: {
    fontSize: FontSizes.labelMD,
    fontWeight: '700',
    color: Colors.secondaryFixed,
    textTransform: 'uppercase',
  },
  aiText: {
    fontSize: FontSizes.bodyMD,
    color: Colors.surfaceContainerHigh,
    marginTop: Spacing.md,
    lineHeight: 22,
  },

  marketButton: {
    backgroundColor: Colors.darkBackground,
    marginHorizontal: Spacing.mobileMargin,
    marginTop: Spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
  },
  marketButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  marketButtonTitle: {
    fontSize: FontSizes.headlineSM,
    fontWeight: '600',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  marketButtonSubtitle: {
    fontSize: FontSizes.bodySM,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },

  section: {
    paddingHorizontal: Spacing.mobileMargin,
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.headlineSM,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  refreshBtn: { padding: Spacing.xs },

  loadingContainer: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  loadingText: { fontSize: FontSizes.bodyMD, color: Colors.onSurfaceVariant },

  errorContainer: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  errorText: { fontSize: FontSizes.bodyMD, color: Colors.error, textAlign: 'center' },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  retryText: { color: Colors.onPrimary, fontSize: FontSizes.labelMD, fontWeight: '700' },

  // Property Card
  propertyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  propertyImage: {
    height: 150,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  statusText: {
    fontSize: FontSizes.labelSM,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  premiumBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  premiumText: {
    fontSize: FontSizes.labelSM,
    fontWeight: '700',
    color: '#fff',
  },
  propertyContent: { padding: Spacing.md, gap: Spacing.xs },
  propertyTitle: {
    fontSize: FontSizes.headlineSM,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  propertyLocation: {
    fontSize: FontSizes.bodySM,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  propertyPrice: {
    fontSize: FontSizes.headlineSM,
    fontWeight: '700',
    color: Colors.secondary,
  },
  propertyBadges: { flexDirection: 'row', gap: Spacing.xs },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: FontSizes.labelSM, color: Colors.onSurfaceVariant },
  tagsRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.xs, flexWrap: 'wrap' },
  tag: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: { fontSize: FontSizes.labelSM, color: Colors.onSurfaceVariant },
});