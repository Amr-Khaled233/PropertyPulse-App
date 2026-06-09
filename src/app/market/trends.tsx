import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, Modal, ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes } from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isMobile = SCREEN_WIDTH < 768;

// ── Types ────────────────────────────────────────────────────────
type CityStats = { city: string; count: number; avgPrice: number };
type TypeStats = { type: string; count: number };
type StatusStats = { status: string; count: number };

type MarketData = {
  totalListings: number;
  forSale: number;
  forRent: number;
  topCity: string;
  topCityAvg: number;
  cityStats: CityStats[];
  typeStats: TypeStats[];
  statusStats: StatusStats[];
};

// ── Helpers ──────────────────────────────────────────────────────
const formatPrice = (val: number) => {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M EGP`;
  if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}K EGP`;
  return `${val.toLocaleString()} EGP`;
};

const formatCount = (val: number) => {
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toString();
};

// ── Main Screen ──────────────────────────────────────────────────
export default function MarketTrendsScreen() {
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Total counts
      const [{ count: total }, { count: forSale }, { count: forRent }] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('offering_type', 'Residential for Sale'),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('offering_type', 'Residential for Rent'),
      ]);

      // City breakdown (for sale)
      const { data: cityRows } = await supabase
        .from('properties')
        .select('city, price_egp')
        .eq('offering_type', 'Residential for Sale')
        .not('city', 'is', null)
        .not('price_egp', 'is', null);

      // Aggregate by city
      const cityMap: Record<string, { total: number; count: number }> = {};
      cityRows?.forEach(r => {
        if (!cityMap[r.city]) cityMap[r.city] = { total: 0, count: 0 };
        cityMap[r.city].total += r.price_egp;
        cityMap[r.city].count += 1;
      });
      const cityStats: CityStats[] = Object.entries(cityMap)
        .map(([city, v]) => ({ city, count: v.count, avgPrice: v.total / v.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Property type breakdown
      const { data: typeRows } = await supabase
        .from('properties')
        .select('property_type')
        .not('property_type', 'is', null);

      const typeMap: Record<string, number> = {};
      typeRows?.forEach(r => { typeMap[r.property_type] = (typeMap[r.property_type] || 0) + 1; });
      const typeStats: TypeStats[] = Object.entries(typeMap)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Completion status (for sale)
      const { data: statusRows } = await supabase
        .from('properties')
        .select('completion_status')
        .eq('offering_type', 'Residential for Sale')
        .not('completion_status', 'is', null);

      const statusMap: Record<string, number> = {};
      statusRows?.forEach(r => { statusMap[r.completion_status] = (statusMap[r.completion_status] || 0) + 1; });
      const statusStats: StatusStats[] = Object.entries(statusMap)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

      // Top city
      const topCity = cityStats.sort((a, b) => b.avgPrice - a.avgPrice)[0];

      setData({
        totalListings: total || 0,
        forSale: forSale || 0,
        forRent: forRent || 0,
        topCity: topCity?.city ?? 'Cairo',
        topCityAvg: topCity?.avgPrice ?? 0,
        cityStats: cityStats.sort((a, b) => b.count - a.count),
        typeStats,
        statusStats,
      });
    } catch (e: any) {
      setError(e.message || 'Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  const maxCityCount = data ? Math.max(...data.cityStats.map(c => c.count)) : 1;
  const maxTypeCount = data ? Math.max(...data.typeStats.map(t => t.count)) : 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>

        {/* Sidebar Modal */}
        <Modal visible={sidebarVisible} animationType="slide" transparent onRequestClose={() => setSidebarVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.sidebar}>
              <View style={styles.sidebarHeader}>
                <View>
                  <Text style={styles.sidebarLogo}>PropertyPulse</Text>
                  <Text style={styles.sidebarSubtitle}>Investor Portal</Text>
                </View>
                <TouchableOpacity onPress={() => setSidebarVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.sidebarMenu}>
                {[
                  { name: 'Dashboard',     icon: 'dashboard',    route: '/home' },
                  { name: 'Market Search', icon: 'search',       route: '/search' },
                  { name: 'Portfolio',     icon: 'pie-chart',    route: '/portfolio' },
                  { name: 'Market Trends', icon: 'trending-up',  route: '/market/trends', active: true },
                ].map(item => (
                  <TouchableOpacity
                    key={item.name}
                    style={[styles.sidebarMenuItem, item.active && styles.sidebarMenuActive]}
                    onPress={() => { setSidebarVisible(false); router.push(item.route as any); }}
                  >
                    <MaterialIcons name={item.icon as any} size={20} color={item.active ? '#fff' : '#79849b'} />
                    <Text style={[styles.sidebarMenuText, item.active && styles.sidebarMenuActiveText]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={isMobile ? () => setSidebarVisible(true) : () => router.back()}>
                <MaterialIcons name={isMobile ? 'menu' : 'arrow-back'} size={24} color={Colors.onSurface} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Egyptian Market Trends</Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchMarketData}>
              <MaterialIcons name="refresh" size={18} color={Colors.secondary} />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.secondary} />
              <Text style={styles.loadingText}>Loading live market data...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={40} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchMarketData}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : data ? (
            <>
              {/* Top Stats */}
              <View style={[styles.statsRow, isMobile && styles.statsRowMobile]}>
                <View style={[styles.statCard, isMobile && styles.statCardFull]}>
                  <Text style={styles.statLabel}>TOTAL LISTINGS</Text>
                  <Text style={styles.statValue}>{formatCount(data.totalListings)}</Text>
                  <View style={styles.statBottom}>
                    <View>
                      <Text style={styles.statSubLabel}>Active Properties</Text>
                      <Text style={styles.statGreen}>Live Database</Text>
                    </View>
                    <MaterialIcons name="home" size={32} color={Colors.secondary} />
                  </View>
                </View>

                <View style={[styles.statCard, isMobile && styles.statCardFull]}>
                  <Text style={styles.statLabel}>TOP MARKET</Text>
                  <Text style={styles.statValue}>{data.topCity}</Text>
                  <View style={styles.statBottom}>
                    <View>
                      <Text style={styles.statSubLabel}>Avg Sale Price</Text>
                      <Text style={styles.statGreen}>{formatPrice(data.topCityAvg)}</Text>
                    </View>
                    <MaterialIcons name="trending-up" size={32} color={Colors.secondary} />
                  </View>
                </View>

                <View style={[styles.statCard, isMobile && styles.statCardFull]}>
                  <Text style={[styles.statLabel, { color: '#bb7400' }]}>MARKET SPLIT</Text>
                  <Text style={styles.statValue}>{formatCount(data.forSale)}</Text>
                  <View style={styles.statBottom}>
                    <View>
                      <Text style={styles.statSubLabel}>For Rent</Text>
                      <Text style={[styles.statValue, { color: '#bb7400', fontSize: FontSizes.bodyLG }]}>
                        {formatCount(data.forRent)}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="trending-up" size={32} color="#bb7400" />
                  </View>
                </View>
              </View>

              {/* City Breakdown + Type Breakdown */}
              <View style={[styles.chartSection, isMobile && styles.chartSectionMobile]}>

                {/* City bars */}
                <View style={[styles.chartCard, isMobile && styles.chartCardFull]}>
                  <Text style={styles.chartTitle}>Listings by City</Text>
                  <View style={styles.barsContainer}>
                    {data.cityStats.map(c => (
                      <View key={c.city} style={styles.barRow}>
                        <Text style={styles.barLabel}>{c.city}</Text>
                        <View style={styles.barTrack}>
                          <View
                            style={[styles.barFill, {
                              width: `${(c.count / maxCityCount) * 100}%`,
                              backgroundColor: Colors.secondary,
                            }]}
                          />
                        </View>
                        <Text style={styles.barValue}>{formatCount(c.count)}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.chartSubnote}>Avg prices: {
                    data.cityStats.map(c => `${c.city} ${formatPrice(c.avgPrice)}`).join(' · ')
                  }</Text>
                </View>

                {/* Side cards */}
                <View style={[styles.sideCards, isMobile && styles.sideCardsFull]}>
                  <View style={styles.analystCard}>
                    <Text style={styles.analystTitle}>Market Insight</Text>
                    <Text style={styles.analystText}>
                      North Coast leads average sale prices at {formatPrice(data.cityStats.find(c => c.city === 'North Coast')?.avgPrice ?? 20_159_868)}.
                      Cairo dominates volume with {formatCount(data.cityStats.find(c => c.city === 'Cairo')?.count ?? 25865)} listings — making it the most liquid market for investors.
                    </Text>
                  </View>

                  <View style={styles.riskCard}>
                    <Text style={styles.riskTitle}>Supply Outlook</Text>
                    <View style={styles.riskHeader}>
                      <View style={[styles.riskDot, { backgroundColor: Colors.secondary }]} />
                      <Text style={[styles.riskSubtitle, { color: Colors.secondary }]}>Strong Inventory</Text>
                    </View>
                    <Text style={styles.riskText}>
                      {formatCount(data.forSale)} properties for sale and {formatCount(data.forRent)} for rent provide strong market depth across all price ranges.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Property Types + Completion Status */}
              <View style={[styles.bottomSection, isMobile && styles.bottomSectionMobile]}>

                {/* Property types */}
                <View style={[styles.heatmapCard, isMobile && styles.heatmapCardFull]}>
                  <Text style={styles.heatmapTitle}>Listings by Property Type</Text>
                  <View style={styles.barsContainer}>
                    {data.typeStats.map((t, i) => {
                      const colors = [Colors.secondary, '#4a90d9', '#bb7400', Colors.error, '#7b5ea7'];
                      return (
                        <View key={t.type} style={styles.barRow}>
                          <Text style={styles.barLabel}>{t.type}</Text>
                          <View style={styles.barTrack}>
                            <View style={[styles.barFill, {
                              width: `${(t.count / maxTypeCount) * 100}%`,
                              backgroundColor: colors[i % colors.length],
                            }]} />
                          </View>
                          <Text style={styles.barValue}>{formatCount(t.count)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Completion status */}
                <View style={[styles.inventoryCard, isMobile && styles.inventoryCardFull]}>
                  <Text style={styles.inventoryTitle}>Completion Status</Text>
                  {data.statusStats.map((s, i) => {
                    const total = data.statusStats.reduce((sum, x) => sum + x.count, 0);
                    const pct = Math.round((s.count / total) * 100);
                    const colors = [Colors.secondary, '#4a90d9', '#bb7400', Colors.error];
                    const label = s.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    return (
                      <View key={s.status} style={styles.inventoryItem}>
                        <View style={styles.inventoryHeader}>
                          <Text style={styles.inventoryLabel}>{label}</Text>
                          <Text style={styles.inventoryValue}>{pct}%</Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, {
                            width: `${pct}%`,
                            backgroundColor: colors[i % colors.length],
                          }]} />
                        </View>
                        <Text style={styles.inventoryCount}>{formatCount(s.count)} listings</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContainer: { flex: 1 },

  loadingContainer: { alignItems: 'center', paddingVertical: 80, gap: Spacing.md },
  loadingText: { fontSize: FontSizes.bodyMD, color: Colors.onSurfaceVariant },
  errorContainer: { alignItems: 'center', paddingVertical: 80, gap: Spacing.md },
  errorText: { fontSize: FontSizes.bodyMD, color: Colors.error, textAlign: 'center' },
  retryButton: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: 8 },
  retryText: { color: Colors.onPrimary, fontSize: FontSizes.labelMD, fontWeight: '700' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: isMobile ? 16 : 32, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: isMobile ? FontSizes.headlineSM : FontSizes.headlineMD, fontWeight: '600', color: Colors.onSurface },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 8, borderWidth: 1, borderColor: Colors.secondary },
  refreshText: { fontSize: FontSizes.labelMD, color: Colors.secondary, fontWeight: '600' },

  // Sidebar
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebar: { width: 280, height: '100%', backgroundColor: Colors.primaryContainer, padding: 24 },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  sidebarLogo: { fontSize: 20, fontWeight: '700', color: '#fff' },
  sidebarSubtitle: { fontSize: 12, color: Colors.onPrimaryContainer, marginTop: 4 },
  sidebarMenu: { gap: 4 },
  sidebarMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8 },
  sidebarMenuActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  sidebarMenuText: { fontSize: FontSizes.bodyMD, color: Colors.onPrimaryContainer },
  sidebarMenuActiveText: { color: '#fff', fontWeight: '600' },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 20, paddingHorizontal: isMobile ? 16 : 32, paddingVertical: 24 },
  statsRowMobile: { flexDirection: 'column' },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 12,
    padding: 20, borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  statCardFull: { width: '100%' },
  statLabel: { fontSize: FontSizes.labelSM, fontWeight: '700', color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  statValue: { fontSize: FontSizes.headlineMD, fontWeight: '700', color: Colors.onSurface, marginTop: 4 },
  statBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 },
  statSubLabel: { fontSize: FontSizes.labelSM, color: Colors.onSurfaceVariant, marginBottom: 4 },
  statGreen: { fontSize: FontSizes.bodyMD, fontWeight: '700', color: Colors.secondary },

  // Chart section
  chartSection: { flexDirection: 'row', gap: 20, paddingHorizontal: isMobile ? 16 : 32, paddingBottom: 20 },
  chartSectionMobile: { flexDirection: 'column', paddingHorizontal: 16 },
  chartCard: { flex: 2, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 12, padding: 24 },
  chartCardFull: { width: '100%' },
  chartTitle: { fontSize: isMobile ? FontSizes.headlineSM : FontSizes.headlineMD, fontWeight: '600', color: Colors.onSurface, marginBottom: 20 },
  chartSubnote: { fontSize: FontSizes.labelSM, color: Colors.onSurfaceVariant, marginTop: 16, lineHeight: 18 },

  // Bars
  barsContainer: { gap: 14 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { fontSize: FontSizes.labelMD, color: Colors.onSurface, width: 90 },
  barTrack: { flex: 1, height: 10, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  barValue: { fontSize: FontSizes.labelMD, color: Colors.onSurfaceVariant, width: 36, textAlign: 'right' },

  // Side cards
  sideCards: { flex: 1, gap: 16 },
  sideCardsFull: { width: '100%', marginTop: 16 },
  analystCard: { backgroundColor: Colors.darkBackground, borderRadius: 12, padding: 20 },
  analystTitle: { fontSize: FontSizes.headlineSM, fontWeight: '600', color: '#fff', marginBottom: 10 },
  analystText: { fontSize: FontSizes.bodySM, lineHeight: 22, color: 'rgba(255,255,255,0.8)' },
  riskCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 12, padding: 20 },
  riskTitle: { fontSize: FontSizes.headlineSM, fontWeight: '600', color: Colors.onSurface, marginBottom: 10 },
  riskHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  riskDot: { width: 10, height: 10, borderRadius: 5 },
  riskSubtitle: { fontSize: FontSizes.labelMD, fontWeight: '600' },
  riskText: { fontSize: FontSizes.bodySM, lineHeight: 20, color: Colors.onSurfaceVariant },

  // Bottom section
  bottomSection: { flexDirection: 'row', gap: 20, padding: isMobile ? 16 : 32 },
  bottomSectionMobile: { flexDirection: 'column', padding: 16 },
  heatmapCard: { flex: 2, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 12, padding: 24 },
  heatmapCardFull: { width: '100%' },
  heatmapTitle: { fontSize: isMobile ? FontSizes.headlineSM : FontSizes.headlineMD, fontWeight: '600', color: Colors.onSurface, marginBottom: 20 },
  inventoryCard: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 12, padding: 24 },
  inventoryCardFull: { width: '100%', marginTop: 16 },
  inventoryTitle: { fontSize: isMobile ? FontSizes.headlineSM : FontSizes.headlineMD, fontWeight: '600', color: Colors.onSurface, marginBottom: 20 },
  inventoryItem: { marginBottom: 16 },
  inventoryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  inventoryLabel: { fontSize: FontSizes.labelMD, fontWeight: '600', color: Colors.onSurface },
  inventoryValue: { fontSize: FontSizes.labelMD, fontWeight: '600', color: Colors.onSurface },
  inventoryCount: { fontSize: FontSizes.labelSM, color: Colors.onSurfaceVariant, marginTop: 4 },
  progressBar: { height: 8, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
});
