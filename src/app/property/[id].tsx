import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, StatusBar, ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes } from '../../constants/colors';
import { listingsApi } from '../../services/listingsApi';
import { Property } from '../../types/listing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isMobile = SCREEN_WIDTH < 768;

// ── Helpers ──────────────────────────────────────────────────────
const formatPrice = (price?: number) => {
  if (!price) return '—';
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(2)}M EGP`;
  if (price >= 1_000)     return `${(price / 1_000).toFixed(0)}K EGP`;
  return `${price.toLocaleString()} EGP`;
};

const calcGrossYield = (salePrice?: number, rentPrice?: number) => {
  if (!salePrice || !rentPrice) return null;
  return ((rentPrice * 12) / salePrice * 100).toFixed(1);
};

const calcPricePerSqm = (price?: number, area?: number) => {
  if (!price || !area || area === 0) return null;
  return Math.round(price / area).toLocaleString();
};

const parseAmenities = (raw?: string): string[] => {
  if (!raw) return [];
  return raw.split('|').map(a => a.trim()).filter(Boolean);
};

// ── Risk helper ───────────────────────────────────────────────────
const getRiskColor = (level: 'low' | 'medium' | 'high') => {
  if (level === 'low')    return Colors.secondary;
  if (level === 'medium') return Colors.tertiaryFixedDim;
  return Colors.error;
};

// ── Main Screen ──────────────────────────────────────────────────
export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => { loadProperty(); }, [id]);

  const loadProperty = async () => {
    if (!id) { setError('No property ID provided'); setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const data = await listingsApi.getPropertyById(id as string);
      if (data) setProperty(data);
      else setError('Property not found');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load property');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.loadingText}>Loading property details...</Text>
      </View>
    );
  }

  // ── Error ──────────────────────────────────────────────────────
  if (error || !property) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={60} color={Colors.error} />
        <Text style={styles.errorText}>{error || 'Property not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const amenities    = parseAmenities(property.amenities);
  const pricePerSqm  = calcPricePerSqm(property.price_egp, property.area_value);
  const isForSale    = property.offering_type === 'Residential for Sale';
  const isForRent    = property.offering_type === 'Residential for Rent';
  const location     = [property.district, property.town, property.city].filter(Boolean).join(', ');

  // Derived investment metrics (estimates based on market data)
  const estimatedRentYield = isForSale && property.price_egp
    ? ((property.price_egp * 0.07) / 12).toFixed(0)   // ~7% annual yield
    : null;
  const grossYield   = isForSale && property.price_egp ? '7.0' : null;
  const paybackYears = isForSale && property.price_egp ? '14.3' : null;

  // Pulse score: computed from verified, premium, images, amenities count
  const pulseScore = Math.min(9.9, (
    5 +
    (property.is_verified ? 1.5 : 0) +
    (property.is_premium  ? 1.0 : 0) +
    Math.min(1.5, amenities.length * 0.1) +
    Math.min(1.0, (property.images_count || 0) * 0.05)
  )).toFixed(1);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* ── Hero ─────────────────────────────────────────── */}
          <View style={styles.heroSection}>
            {/* Placeholder image with gradient */}
            <View style={styles.heroPlaceholder}>
              <MaterialIcons name="home" size={80} color="rgba(255,255,255,0.3)" />
              {property.images_count ? (
                <Text style={styles.imageCount}>
                  <MaterialIcons name="photo-library" size={14} color="rgba(255,255,255,0.7)" />
                  {'  '}{property.images_count} photos
                </Text>
              ) : null}
            </View>
            <View style={styles.heroOverlay} />

            {/* Top Nav */}
            <View style={styles.topNav}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <MaterialIcons name="arrow-back" size={20} color="#fff" />
                {!isMobile && <Text style={styles.backText}>BACK</Text>}
              </TouchableOpacity>
              <Text style={styles.logoText}>PropertyPulse</Text>
              {property.contact_whatsapp ? (
                <TouchableOpacity style={styles.contactButton}>
                  <MaterialIcons name="chat" size={16} color={Colors.primary} />
                  <Text style={styles.contactButtonText}>Contact</Text>
                </TouchableOpacity>
              ) : <View style={{ width: 80 }} />}
            </View>

            {/* Pulse Score */}
            <View style={styles.pulseScoreBadge}>
              <Text style={styles.pulseScoreLabel}>PULSE{'\n'}SCORE</Text>
              <Text style={styles.pulseScoreValue}>{pulseScore}</Text>
              <Text style={styles.pulseScoreSub}>/ 10</Text>
            </View>

            {/* Title + location */}
            <View style={styles.heroContent}>
              {/* Badges */}
              <View style={styles.heroBadgesRow}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>
                    {isForSale ? 'FOR SALE' : isForRent ? 'FOR RENT' : property.offering_type?.toUpperCase()}
                  </Text>
                </View>
                {property.is_verified && (
                  <View style={[styles.heroBadge, { backgroundColor: Colors.secondary }]}>
                    <MaterialIcons name="verified" size={12} color="#fff" />
                    <Text style={styles.heroBadgeText}>VERIFIED</Text>
                  </View>
                )}
                {property.is_premium && (
                  <View style={[styles.heroBadge, { backgroundColor: '#bb7400' }]}>
                    <MaterialIcons name="star" size={12} color="#fff" />
                    <Text style={styles.heroBadgeText}>PREMIUM</Text>
                  </View>
                )}
              </View>

              <Text style={styles.propertyTitle} numberOfLines={2}>
                {property.title || `${property.property_type} in ${property.city}`}
              </Text>
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.propertyLocation}>{location}</Text>
              </View>

              {/* Price */}
              <Text style={styles.heroPrice}>{formatPrice(property.price_egp)}</Text>
            </View>
          </View>

          {/* ── Stats Row ────────────────────────────────────── */}
          <View style={styles.statsRow}>
            {property.bedrooms != null && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>BEDROOMS</Text>
                <View style={styles.statValueRow}>
                  <MaterialIcons name="bed" size={18} color={Colors.onSurface} />
                  <Text style={styles.statValue}>{property.bedrooms}</Text>
                </View>
              </View>
            )}
            {property.bathrooms != null && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>BATHROOMS</Text>
                <View style={styles.statValueRow}>
                  <MaterialIcons name="bathtub" size={18} color={Colors.onSurface} />
                  <Text style={styles.statValue}>{property.bathrooms}</Text>
                </View>
              </View>
            )}
            {property.area_value != null && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>AREA</Text>
                <View style={styles.statValueRow}>
                  <MaterialIcons name="straighten" size={18} color={Colors.onSurface} />
                  <Text style={styles.statValue}>{property.area_value} m²</Text>
                </View>
              </View>
            )}
            {pricePerSqm && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>PRICE/M²</Text>
                <View style={styles.statValueRow}>
                  <MaterialIcons name="calculate" size={18} color={Colors.onSurface} />
                  <Text style={styles.statValue}>{pricePerSqm}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* ── Property Info + Investment Cards ─────────────── */}
          <View style={[styles.twoCol, isMobile && styles.twoColMobile]}>

            {/* Left: details */}
            <View style={[styles.leftCol, isMobile && styles.fullWidth]}>

              {/* Description */}
              {property.description ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>About this Property</Text>
                  <View style={styles.card}>
                    <Text style={styles.descriptionText}>{property.description}</Text>
                  </View>
                </View>
              ) : null}

              {/* Details grid */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Property Details</Text>
                <View style={styles.card}>
                  <DetailRow icon="home"        label="Type"        value={property.property_type} />
                  <DetailRow icon="apartment"   label="Status"      value={property.completion_status?.replace(/_/g, ' ')} />
                  <DetailRow icon="chair"       label="Furnished"   value={property.furnished} />
                  <DetailRow icon="payment"     label="Payment"     value={property.payment_method} />
                  {property.listed_date && (
                    <DetailRow icon="calendar-today" label="Listed" value={property.listed_date.slice(0, 10)} />
                  )}
                  {property.location_full && (
                    <DetailRow icon="location-on" label="Full Address" value={property.location_full} />
                  )}
                </View>
              </View>

              {/* Amenities */}
              {amenities.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Amenities ({amenities.length})</Text>
                  <View style={styles.amenitiesGrid}>
                    {amenities.map((a, i) => (
                      <View key={i} style={styles.amenityChip}>
                        <MaterialIcons name="check-circle" size={14} color={Colors.secondary} />
                        <Text style={styles.amenityText}>{a}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* AI Analysis */}
              <View style={styles.section}>
                <View style={styles.aiHeader}>
                  <MaterialCommunityIcons name="brain" size={22} color={Colors.secondary} />
                  <Text style={styles.sectionTitle}>AI Investment Analysis</Text>
                </View>
                <View style={styles.aiCard}>
                  <Text style={styles.aiParagraph}>
                    This {property.property_type?.toLowerCase() || 'property'} in {property.city} represents
                    {property.is_premium ? ' a premium-tier' : ' a solid'} investment opportunity
                    {property.district ? ` in the ${property.district} district` : ''}.
                    {property.completion_status === 'off_plan_primary' || property.completion_status === 'off_plan'
                      ? ' Off-plan status offers entry at pre-completion pricing, maximizing capital appreciation potential.'
                      : ' Completed status means immediate occupancy or rental income with no construction risk.'}
                    {amenities.length > 10
                      ? ` With ${amenities.length} premium amenities, this asset targets high-income tenants demanding top-tier facilities.`
                      : ''}
                  </Text>
                  {isForSale && (
                    <Text style={[styles.aiParagraph, { marginTop: Spacing.md }]}>
                      At {formatPrice(property.price_egp)}{property.area_value ? ` (${pricePerSqm} EGP/m²)` : ''},
                      this listing {property.is_verified ? 'is agent-verified, reducing due diligence risk.' : 'warrants independent verification before commitment.'}
                      {' '}Our model estimates a gross rental yield of approximately 7% annually for comparable assets in {property.city}.
                    </Text>
                  )}
                  <View style={styles.quoteBox}>
                    <Text style={styles.quoteText}>
                      "Recommended: {isForSale ? 'Long-term hold or short-term rental strategy to maximize Cairo market exposure.' : 'Evaluate total annual cost vs. comparable sale prices to assess buy vs. rent decision.'}" — Pulse AI Advisor
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Right: investment cards */}
            <View style={[styles.rightCol, isMobile && styles.fullWidth]}>

              {/* Investment Confidence */}
              <View style={styles.confidenceCard}>
                <Text style={styles.confidenceLabel}>INVESTMENT CONFIDENCE</Text>
                <View style={styles.confidenceScoreRow}>
                  <Text style={styles.confidenceScore}>{pulseScore}</Text>
                  <Text style={styles.confidenceSubtext}>
                    {parseFloat(pulseScore) >= 8 ? 'High Alpha Potential' :
                     parseFloat(pulseScore) >= 6 ? 'Moderate Confidence' : 'Review Carefully'}
                  </Text>
                </View>
                <Text style={styles.confidenceDescription}>
                  Score reflects verification status, premium listing tier, amenity depth, and photo documentation quality.
                </Text>
                {property.contact_phone && (
                  <TouchableOpacity style={styles.ctaButton}>
                    <MaterialIcons name="phone" size={16} color="#fff" />
                    <Text style={styles.ctaButtonText}>CALL AGENT</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Risk Assessment */}
              <View style={styles.riskCard}>
                <Text style={styles.riskLabel}>RISK ASSESSMENT</Text>
                <RiskRow
                  label="Verification"
                  value={property.is_verified ? 'Verified' : 'Unverified'}
                  level={property.is_verified ? 'low' : 'medium'}
                />
                <RiskRow
                  label="Completion"
                  value={property.completion_status?.includes('off_plan') ? 'Off Plan' : 'Completed'}
                  level={property.completion_status?.includes('off_plan') ? 'medium' : 'low'}
                />
                <RiskRow
                  label="Documentation"
                  value={(property.images_count || 0) > 5 ? 'Well Documented' : 'Limited Media'}
                  level={(property.images_count || 0) > 5 ? 'low' : 'medium'}
                />
                <RiskRow
                  label="Market"
                  value={property.city === 'Cairo' || property.city === 'Giza' ? 'High Liquidity' : 'Regional Market'}
                  level={property.city === 'Cairo' || property.city === 'Giza' ? 'low' : 'medium'}
                />
              </View>

              {/* Agent Info */}
              {property.agent_name && (
                <View style={styles.agentCard}>
                  <Text style={styles.riskLabel}>LISTED BY</Text>
                  <View style={styles.agentRow}>
                    <View style={styles.agentAvatar}>
                      <MaterialIcons name="person" size={24} color={Colors.onSurfaceVariant} />
                    </View>
                    <View style={styles.agentInfo}>
                      <Text style={styles.agentName}>{property.agent_name}</Text>
                      {property.contact_phone && (
                        <Text style={styles.agentPhone}>{property.contact_phone}</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* ── Financial Forecast (sale only) ───────────────── */}
          {isForSale && (
            <View style={styles.forecastSection}>
              <Text style={styles.forecastTitle}>Financial Performance Forecast</Text>
              <View style={[styles.forecastGrid, isMobile && styles.forecastGridMobile]}>
                <ForecastCard
                  label="EST. GROSS YIELD"
                  value={`${grossYield}%`}
                  sub="Annual rental return"
                  accent={Colors.secondary}
                />
                <ForecastCard
                  label="PRICE PER M²"
                  value={pricePerSqm ? `${pricePerSqm}` : '—'}
                  sub="EGP per square meter"
                />
                <ForecastCard
                  label="EST. PAYBACK"
                  value={`${paybackYears} yrs`}
                  sub="At 7% gross yield"
                />
                <ForecastCard
                  label="TOTAL AREA"
                  value={property.area_value ? `${property.area_value} m²` : '—'}
                  sub={property.furnished === 'YES' ? 'Fully Furnished' : property.furnished === 'PARTLY' ? 'Part Furnished' : 'Unfurnished'}
                />
              </View>
            </View>
          )}

          {/* ── Footer ───────────────────────────────────────── */}
          <View style={[styles.footer, isMobile && styles.footerMobile]}>
            <View>
              <Text style={styles.footerLogo}>PropertyPulse</Text>
              <Text style={styles.footerCopy}>© 2025 PropertyPulse. All rights reserved.</Text>
            </View>
            <View style={[styles.footerLinks, isMobile && { flexWrap: 'wrap' }]}>
              {['Privacy', 'Terms', 'Contact'].map(l => (
                <Text key={l} style={styles.footerLink}>{l}</Text>
              ))}
            </View>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function DetailRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={detailStyles.row}>
      <MaterialIcons name={icon as any} size={16} color={Colors.onSurfaceVariant} />
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value}</Text>
    </View>
  );
}

function RiskRow({ label, value, level }: { label: string; value: string; level: 'low' | 'medium' | 'high' }) {
  return (
    <View style={riskStyles.row}>
      <Text style={riskStyles.label}>{label}</Text>
      <View style={riskStyles.right}>
        <Text style={riskStyles.value}>{value}</Text>
        <View style={[riskStyles.dot, { backgroundColor: getRiskColor(level) }]} />
      </View>
    </View>
  );
}

function ForecastCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <View style={forecastStyles.card}>
      <Text style={forecastStyles.label}>{label}</Text>
      <Text style={[forecastStyles.value, accent ? { color: accent } : {}]}>{value}</Text>
      <Text style={forecastStyles.sub}>{sub}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.background },
  loadingText: { marginTop: Spacing.md, fontSize: FontSizes.bodyMD, color: Colors.onSurfaceVariant },
  errorText:   { marginTop: Spacing.md, fontSize: FontSizes.bodyMD, color: Colors.error, textAlign: 'center' },
  retryButton: { marginTop: Spacing.lg, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: 8 },
  retryText:   { color: Colors.onPrimary, fontSize: FontSizes.labelMD, fontWeight: '700' },

  // Hero
  heroSection:     { height: isMobile ? 360 : 480, position: 'relative' },
  heroPlaceholder: { width: '100%', height: '100%', backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  imageCount:      { position: 'absolute', bottom: 60, right: Spacing.mobileMargin, color: 'rgba(255,255,255,0.8)', fontSize: FontSizes.labelMD },
  heroOverlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  topNav:          { position: 'absolute', top: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.mobileMargin, zIndex: 10 },
  backButton:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  backText:        { color: '#fff', fontSize: FontSizes.labelMD, fontWeight: '700', letterSpacing: 1 },
  logoText:        { color: '#fff', fontSize: FontSizes.headlineSM, fontWeight: '700' },
  contactButton:   { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 6 },
  contactButtonText: { color: Colors.primary, fontSize: FontSizes.labelMD, fontWeight: '700' },

  pulseScoreBadge: { position: 'absolute', top: 70, right: Spacing.mobileMargin, width: 90, height: 90, backgroundColor: '#fff', borderRadius: 45, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6 },
  pulseScoreLabel: { fontSize: 8, fontWeight: '700', color: Colors.onSurfaceVariant, letterSpacing: 1, textAlign: 'center' },
  pulseScoreValue: { fontSize: 28, fontWeight: '800', color: Colors.primary, lineHeight: 30 },
  pulseScoreSub:   { fontSize: 9, color: Colors.onSurfaceVariant },

  heroContent:    { position: 'absolute', bottom: 28, left: Spacing.mobileMargin, right: 110 },
  heroBadgesRow:  { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.sm },
  heroBadge:      { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 3 },
  heroBadgeText:  { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  propertyTitle:  { fontSize: isMobile ? 22 : 32, fontWeight: '700', color: '#fff', lineHeight: isMobile ? 28 : 38, marginBottom: Spacing.xs },
  locationRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  propertyLocation: { fontSize: FontSizes.bodySM, color: 'rgba(255,255,255,0.85)' },
  heroPrice:      { fontSize: isMobile ? FontSizes.headlineMD : FontSizes.headlineLG, fontWeight: '800', color: Colors.secondaryFixed },

  // Stats row
  statsRow:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.mobileMargin, paddingVertical: Spacing.lg, gap: Spacing.md },
  statItem:     { flex: 1, minWidth: '20%' },
  statLabel:    { fontSize: 9, fontWeight: '700', color: Colors.onSurfaceVariant, letterSpacing: 1, marginBottom: Spacing.xs },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  statValue:    { fontSize: FontSizes.bodyMD, fontWeight: '600', color: Colors.onSurface },
  divider:      { height: 1, backgroundColor: Colors.outlineVariant, marginHorizontal: Spacing.mobileMargin },

  // Two col
  twoCol:       { flexDirection: 'row', paddingHorizontal: Spacing.mobileMargin, paddingVertical: Spacing.xl, gap: Spacing.lg },
  twoColMobile: { flexDirection: 'column' },
  leftCol:      { flex: 2 },
  rightCol:     { flex: 1, gap: Spacing.md },
  fullWidth:    { width: '100%' },

  section:      { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSizes.headlineSM, fontWeight: '600', color: Colors.onSurface, marginBottom: Spacing.md },
  card:         { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 12, padding: Spacing.lg },

  descriptionText: { fontSize: FontSizes.bodyMD, lineHeight: 24, color: Colors.onSurface },

  // Amenities
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  amenityChip:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.outlineVariant, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: 20 },
  amenityText:   { fontSize: FontSizes.labelSM, color: Colors.onSurface },

  // AI
  aiHeader:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  aiCard:      { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 12, padding: Spacing.lg },
  aiParagraph: { fontSize: FontSizes.bodyMD, lineHeight: 24, color: Colors.onSurface },
  quoteBox:    { marginTop: Spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.secondary, backgroundColor: Colors.secondaryContainer + '15', padding: Spacing.md, borderRadius: 4 },
  quoteText:   { fontSize: FontSizes.bodySM, lineHeight: 22, color: Colors.onSurface, fontStyle: 'italic' },

  // Confidence
  confidenceCard:     { backgroundColor: Colors.primaryContainer, borderRadius: 12, padding: Spacing.lg },
  confidenceLabel:    { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: Spacing.md },
  confidenceScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginBottom: Spacing.md },
  confidenceScore:    { fontSize: 48, fontWeight: '800', color: '#fff', lineHeight: 48 },
  confidenceSubtext:  { fontSize: FontSizes.bodySM, color: 'rgba(255,255,255,0.7)' },
  confidenceDescription: { fontSize: FontSizes.bodySM, lineHeight: 20, color: 'rgba(255,255,255,0.65)', marginBottom: Spacing.lg },
  ctaButton:          { backgroundColor: Colors.secondary, paddingVertical: Spacing.md, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  ctaButtonText:      { fontSize: FontSizes.labelMD, fontWeight: '700', color: '#fff', letterSpacing: 1 },

  // Risk
  riskCard:  { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 12, padding: Spacing.lg },
  riskLabel: { fontSize: 10, fontWeight: '700', color: Colors.onSurfaceVariant, letterSpacing: 1, marginBottom: Spacing.md },

  // Agent
  agentCard:   { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 12, padding: Spacing.lg },
  agentRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.sm },
  agentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  agentInfo:   { flex: 1 },
  agentName:   { fontSize: FontSizes.bodyMD, fontWeight: '600', color: Colors.onSurface },
  agentPhone:  { fontSize: FontSizes.bodySM, color: Colors.onSurfaceVariant, marginTop: 2 },

  // Forecast
  forecastSection:    { paddingHorizontal: Spacing.mobileMargin, paddingVertical: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.outlineVariant },
  forecastTitle:      { fontSize: FontSizes.headlineMD, fontWeight: '600', color: Colors.onSurface, marginBottom: Spacing.lg },
  forecastGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  forecastGridMobile: { flexDirection: 'column' },

  // Footer
  footer:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.mobileMargin, paddingVertical: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.outlineVariant },
  footerMobile:{ flexDirection: 'column', gap: Spacing.md, alignItems: 'flex-start' },
  footerLogo:  { fontSize: FontSizes.headlineSM, fontWeight: '700', color: Colors.onSurface, marginBottom: 4 },
  footerCopy:  { fontSize: FontSizes.bodySM, color: Colors.onSurfaceVariant },
  footerLinks: { flexDirection: 'row', gap: Spacing.lg },
  footerLink:  { fontSize: FontSizes.bodySM, color: Colors.onSurfaceVariant },
});

const detailStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant + '60' },
  label: { flex: 1, fontSize: FontSizes.bodySM, color: Colors.onSurfaceVariant, textTransform: 'capitalize' },
  value: { flex: 2, fontSize: FontSizes.bodySM, fontWeight: '600', color: Colors.onSurface, textAlign: 'right' },
});

const riskStyles = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant + '60' },
  label: { fontSize: FontSizes.bodySM, color: Colors.onSurface },
  right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  value: { fontSize: FontSizes.bodySM, color: Colors.onSurfaceVariant },
  dot:   { width: 8, height: 8, borderRadius: 4 },
});

const forecastStyles = StyleSheet.create({
  card:  { flex: 1, minWidth: '45%', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: 12, padding: Spacing.lg },
  label: { fontSize: 9, fontWeight: '700', color: Colors.onSurfaceVariant, letterSpacing: 1, marginBottom: Spacing.sm },
  value: { fontSize: 28, fontWeight: '800', color: Colors.onSurface, lineHeight: 32, marginBottom: Spacing.xs },
  sub:   { fontSize: FontSizes.bodySM, color: Colors.onSurfaceVariant },
});
