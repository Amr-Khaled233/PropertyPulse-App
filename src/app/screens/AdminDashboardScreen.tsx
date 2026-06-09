import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { BrandMark } from '../../components/common/Brand';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius, shadow } from '../../theme/theme';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Admin'>;

type Stats = {
  totalListings: number;
  forSale: number;
  forRent: number;
  verified: number;
  premium: number;
  topCity: string;
  avgPrice: number;
};

export function AdminDashboardScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') fetchStats();
  }, [user?.role]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const [
        { count: total },
        { count: forSale },
        { count: forRent },
        { count: verified },
        { count: premium },
      ] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('offering_type', 'Residential for Sale'),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('offering_type', 'Residential for Rent'),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('is_premium', true),
      ]);

      // Top city by listing count
      const { data: cityRows } = await supabase
        .from('properties')
        .select('city')
        .not('city', 'is', null);

      const cityMap: Record<string, number> = {};
      cityRows?.forEach(r => { cityMap[r.city] = (cityMap[r.city] || 0) + 1; });
      const topCity = Object.entries(cityMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Cairo';

      // Avg sale price (sample)
      const { data: priceRows } = await supabase
        .from('properties')
        .select('price_egp')
        .eq('offering_type', 'Residential for Sale')
        .not('price_egp', 'is', null)
        .limit(200);

      const avgPrice = priceRows && priceRows.length > 0
        ? priceRows.reduce((s, r) => s + r.price_egp, 0) / priceRows.length
        : 0;

      setStats({
        totalListings: total || 0,
        forSale: forSale || 0,
        forRent: forRent || 0,
        verified: verified || 0,
        premium: premium || 0,
        topCity,
        avgPrice,
      });
    } catch (e) {
      console.error('Admin stats error:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatCompact = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000)     return `${(val / 1_000).toFixed(0)}K`;
    return val.toLocaleString();
  };

  const director = user?.fullName?.split(' ')[0] ?? 'Director';

  if (user?.role !== 'admin') {
    return (
      <View style={{ flex: 1, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Ionicons name="lock-closed-outline" size={40} color={c.textMuted} />
        <AppText color="textMuted" center style={{ marginTop: 12 }}>
          You don&apos;t have access to this area.
        </AppText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={c.text} />
          </Pressable>
          <BrandMark size={20} />
        </View>
        <Ionicons name="notifications-outline" size={22} color={c.textSecondary} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.2, color: c.tertiary }}>
            ADMIN DASHBOARD
          </AppText>
          <AppText style={{ fontFamily: fonts.serif, fontSize: 26, color: c.text, marginTop: 2 }}>
            Welcome back, {director}
          </AppText>
        </View>

        {/* Stats grid */}
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={c.secondary} />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <StatCard
              icon="home-outline"
              label="TOTAL LISTINGS"
              value={formatCompact(stats?.totalListings ?? 0)}
              onPress={() => navigation.navigate('AdminUsers')}
            />
            <StatCard
              icon="pricetag-outline"
              label="FOR SALE"
              value={formatCompact(stats?.forSale ?? 0)}
            />
            <StatCard
              icon="key-outline"
              label="FOR RENT"
              value={formatCompact(stats?.forRent ?? 0)}
            />
            <StatCard
              icon="shield-checkmark-outline"
              label="VERIFIED"
              value={formatCompact(stats?.verified ?? 0)}
            />
            <StatCard
              icon="star-outline"
              label="PREMIUM"
              value={formatCompact(stats?.premium ?? 0)}
            />
            <RevenueCard
              label="AVG SALE PRICE"
              value={`${formatCompact(stats?.avgPrice ?? 0)} EGP`}
            />
          </View>
        )}

        {/* Top city */}
        {stats && (
          <Card padded>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.secondaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="location-outline" size={20} color={c.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontFamily: fonts.semibold, fontSize: 15 }}>
                  Top Market: {stats.topCity}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  Highest listing volume in the database
                </AppText>
              </View>
            </View>
          </Card>
        )}

        {/* Manage users CTA */}
        <Pressable
          onPress={() => navigation.navigate('AdminUsers')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.lg, padding: 16 }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.secondaryMuted, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="people" size={20} color={c.secondary} />
          </View>
          <AppText style={{ flex: 1, fontFamily: fonts.semibold, fontSize: 15 }}>Manage Users</AppText>
          <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
        </Pressable>

        {/* Quick actions */}
        <View>
          <AppText style={{ fontFamily: fonts.serif, fontSize: 20, color: c.tertiary, marginBottom: 12 }}>
            Quick Actions
          </AppText>
          <View style={{ gap: 12 }}>
            <ActionRow
              icon="stats-chart-outline"
              title="Market Trends"
              subtitle="View full property market analysis"
              onPress={() => navigation.goBack()}
            />
            <ActionRow
              icon="people-outline"
              title="User Management"
              subtitle={`Manage platform users and roles`}
              onPress={() => navigation.navigate('AdminUsers')}
            />
            <ActionRow
              icon="notifications-outline"
              title="Notifications"
              subtitle="View and send platform alerts"
              onPress={() => navigation.navigate('Notifications')}
            />
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => navigation.navigate('AdminUsers')}
        style={{
          position: 'absolute', right: 20,
          bottom: insets.bottom + 24,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: c.primary,
          alignItems: 'center', justifyContent: 'center',
          ...shadow.card,
        }}
      >
        <Ionicons name="add" size={28} color={c.textOnPrimary} />
      </Pressable>
    </View>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function StatCard({
  icon, label, value, change, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  change?: number;
  onPress?: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ flexBasis: '47%', flexGrow: 1 }}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Ionicons name={icon} size={18} color={c.textMuted} />
          {change != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Ionicons name={change >= 0 ? 'arrow-up' : 'arrow-down'} size={11} color={change >= 0 ? c.success : c.danger} />
              <AppText style={{ fontFamily: fonts.semibold, fontSize: 11, color: change >= 0 ? c.success : c.danger }}>
                {Math.abs(change)}%
              </AppText>
            </View>
          )}
        </View>
        <AppText style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 0.8, color: c.textMuted, marginTop: 10 }}>
          {label}
        </AppText>
        <AppText style={{ fontFamily: fonts.heading, fontSize: 24, marginTop: 2 }}>{value}</AppText>
      </Card>
    </Pressable>
  );
}

function RevenueCard({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: c.primary, borderRadius: radius.lg, padding: 16, ...shadow.soft }}>
      <Ionicons name="trending-up-outline" size={18} color={c.secondary} />
      <AppText style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 0.8, color: '#9FB0C4', marginTop: 10 }}>
        {label}
      </AppText>
      <AppText style={{ fontFamily: fonts.heading, fontSize: 22, color: '#fff', marginTop: 2 }}>{value}</AppText>
    </View>
  );
}

function ActionRow({
  icon, title, subtitle, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, padding: 14 }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.secondaryMuted, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={c.secondary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText style={{ fontFamily: fonts.semibold, fontSize: 14 }}>{title}</AppText>
        <AppText variant="caption" color="textMuted">{subtitle}</AppText>
      </View>
      <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
    </Pressable>
  );
}