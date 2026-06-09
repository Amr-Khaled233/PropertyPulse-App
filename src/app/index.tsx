import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSizes } from '../constants/colors';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

type Stats = {
  totalListings: number;
  forSale: number;
  forRent: number;
  cities: number;
  avgPrice: number;
};

export default function LandingScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Total count
        const { count: total } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true });

        // For sale count
        const { count: forSale } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('offering_type', 'Residential for Sale');

        // For rent count
        const { count: forRent } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('offering_type', 'Residential for Rent');

        // Distinct cities (just fetch first 1000 and get unique)
        const { data: cityData } = await supabase
          .from('properties')
          .select('city')
          .not('city', 'is', null)
          .limit(1000);

        const uniqueCities = new Set(cityData?.map((r) => r.city)).size;

        // Avg sale price
        const { data: priceData } = await supabase
          .from('properties')
          .select('price_egp')
          .eq('offering_type', 'Residential for Sale')
          .not('price_egp', 'is', null)
          .limit(500);

        const avg =
          priceData && priceData.length > 0
            ? priceData.reduce((sum, r) => sum + (r.price_egp || 0), 0) /
              priceData.length
            : 0;

        setStats({
          totalListings: total || 0,
          forSale: forSale || 0,
          forRent: forRent || 0,
          cities: uniqueCities,
          avgPrice: avg,
        });
      } catch (e) {
        console.error('Stats fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatPrice = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
    return val.toString();
  };

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Hero */}
      <LinearGradient
        colors={['#101c2e', '#1a2b4a']}
        style={styles.hero}
      >
        <View style={styles.heroContent}>
          <Text style={styles.badge}>INSTITUTIONAL GRADE AI</Text>
          <Text style={styles.title}>
            The Future of Real Estate Investment Is{' '}
            <Text style={styles.italic}>Algorithmic</Text>
          </Text>
          <Text style={styles.subtitle}>
            Leverage enterprise-grade AI to analyze Egyptian market dynamics
            across {stats?.cities ?? '—'} cities in real time.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/home')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Start Your Analysis</Text>
            <MaterialIcons name="arrow-forward" size={18} color={Colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Live Stats from Supabase */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionLabel}>LIVE DATABASE</Text>
        <Text style={styles.sectionTitle}>Real Market Data</Text>

        {loading ? (
          <ActivityIndicator
            color={Colors.secondary}
            size="large"
            style={{ marginTop: Spacing.lg }}
          />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              icon="home"
              value={stats?.totalListings.toLocaleString() ?? '—'}
              label="Total Listings"
              accent={Colors.secondary}
            />
            <StatCard
              icon="sell"
              value={stats?.forSale.toLocaleString() ?? '—'}
              label="For Sale"
              accent="#4a90d9"
            />
            <StatCard
              icon="vpn-key"
              value={stats?.forRent.toLocaleString() ?? '—'}
              label="For Rent"
              accent={Colors.tertiaryFixedDim}
            />
            <StatCard
              icon="trending-up"
              value={`${formatPrice(stats?.avgPrice ?? 0)} EGP`}
              label="Avg Sale Price"
              accent="#e07b54"
            />
          </View>
        )}
      </View>

      {/* Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionLabel}>WHAT YOU CAN DO</Text>
        <Text style={styles.sectionTitle}>Built for Investors</Text>

        <FeatureRow
          icon="search"
          title="Smart Property Search"
          desc="Filter by city, price, type, bedrooms, and completion status across 39K+ listings."
        />
        <FeatureRow
          icon="map"
          title="Interactive Map View"
          desc="Visualize properties on a live map with price overlays by district."
        />
        <FeatureRow
          icon="calculate"
          title="ROI Calculator"
          desc="Compare sale vs rental prices in the same area to calculate gross yield instantly."
        />
        <FeatureRow
          icon="insights"
          title="Market Trends"
          desc="Track price movements across Cairo, Giza, North Coast, and Red Sea."
        />
      </View>

      {/* CTA */}
      <LinearGradient
        colors={[Colors.secondary, '#004d38']}
        style={styles.ctaSection}
      >
        <Text style={styles.ctaTitle}>Ready to invest smarter?</Text>
        <Text style={styles.ctaSubtitle}>
          Access the full Egyptian property market in seconds.
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/home')}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaButtonText}>Browse Properties</Text>
          <MaterialIcons name="arrow-forward" size={18} color={Colors.secondary} />
        </TouchableOpacity>
      </LinearGradient>
    </ScrollView>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: string;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <View style={statStyles.card}>
      <View style={[statStyles.iconWrap, { backgroundColor: accent + '20' }]}>
        <MaterialIcons name={icon as any} size={20} color={accent} />
      </View>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <View style={featureStyles.row}>
      <View style={featureStyles.iconWrap}>
        <MaterialIcons name={icon as any} size={22} color={Colors.secondary} />
      </View>
      <View style={featureStyles.text}>
        <Text style={featureStyles.title}>{title}</Text>
        <Text style={featureStyles.desc}>{desc}</Text>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Hero
  hero: {
    minHeight: height * 0.6,
    paddingHorizontal: Spacing.mobileMargin,
    paddingTop: 80,
    paddingBottom: Spacing.xl,
    justifyContent: 'center',
  },
  heroContent: { gap: Spacing.lg },
  badge: {
    fontSize: FontSizes.labelMD,
    fontWeight: '700',
    color: Colors.secondaryFixed,
    letterSpacing: 2,
  },
  title: {
    fontSize: FontSizes.headlineXL,
    fontWeight: '600',
    color: Colors.onPrimary,
    lineHeight: 56,
  },
  italic: { fontStyle: 'italic', fontWeight: '400' },
  subtitle: {
    fontSize: FontSizes.bodyLG,
    color: Colors.onPrimaryContainer,
    lineHeight: 28,
  },
  primaryButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  primaryButtonText: {
    fontSize: FontSizes.bodyMD,
    fontWeight: '700',
    color: Colors.onPrimary,
  },

  // Stats
  statsSection: {
    paddingHorizontal: Spacing.mobileMargin,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.background,
  },
  sectionLabel: {
    fontSize: FontSizes.labelSM,
    fontWeight: '700',
    color: Colors.secondary,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.headlineMD,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },

  // Features
  featuresSection: {
    paddingHorizontal: Spacing.mobileMargin,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surfaceContainerLow,
    gap: Spacing.md,
  },

  // CTA
  ctaSection: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  ctaTitle: {
    fontSize: FontSizes.headlineMD,
    fontWeight: '700',
    color: Colors.onPrimary,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: FontSizes.bodyMD,
    color: Colors.secondaryContainer,
    textAlign: 'center',
    opacity: 0.9,
  },
  ctaButton: {
    backgroundColor: Colors.onPrimary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  ctaButtonText: {
    fontSize: FontSizes.bodyMD,
    fontWeight: '700',
    color: Colors.secondary,
  },
});

const statStyles = StyleSheet.create({
  card: {
    width: (width - Spacing.mobileMargin * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: FontSizes.headlineSM,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  label: {
    fontSize: FontSizes.labelMD,
    color: Colors.onSurfaceVariant,
  },
});

const featureStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.secondaryContainer + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 4 },
  title: {
    fontSize: FontSizes.bodyMD,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  desc: {
    fontSize: FontSizes.bodySM,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
});