import { useEffect, useState } from 'react';
import { SectionList, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/common/Screen';
import { ScreenHeader } from '../../components/common/Brand';
import { AppText } from '../../components/common/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/theme';
import { formatSigned } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Transactions'>;

// ── Transaction type ─────────────────────────────────────────────
type TxType = 'rental' | 'mortgage' | 'purchase' | 'subscription';

interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  date: string;
  ref: string;
}

const ICON: Record<TxType, keyof typeof Ionicons.glyphMap> = {
  rental:       'cash-outline',
  mortgage:     'card-outline',
  purchase:     'home-outline',
  subscription: 'star-outline',
};

// ── Derive transactions from real Supabase property data ─────────
// Each listing generates 1-2 transactions:
//   - For Sale   → a "purchase" transaction at listing price
//   - For Rent   → a "rental" income transaction at monthly price
// Plus a fixed subscription entry

const deriveTransactions = (rows: any[]): Transaction[] => {
  const txs: Transaction[] = [];

  // Fixed subscription
  txs.push({
    id: 'sub-1',
    type: 'subscription',
    amount: -568.86,
    date: new Date().toISOString().slice(0, 10),
    ref: 'PropertyPulse Institutional AI',
  });

  rows.forEach((p, i) => {
    if (p.offering_type === 'Residential for Sale' && p.price_egp) {
      txs.push({
        id: `purchase-${p.listing_id}`,
        type: 'purchase',
        amount: -p.price_egp,
        date: p.listed_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        ref: p.title || p.property_type || 'Property',
      });
    }

    if (p.offering_type === 'Residential for Rent' && p.price_egp) {
      txs.push({
        id: `rental-${p.listing_id}`,
        type: 'rental',
        amount: p.price_egp,
        date: p.listed_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        ref: p.title || `${p.city} Rental`,
      });
    }

    // Add a mortgage entry for every 3rd sale property
    if (p.offering_type === 'Residential for Sale' && p.price_egp && i % 3 === 0) {
      txs.push({
        id: `mortgage-${p.listing_id}`,
        type: 'mortgage',
        amount: -Math.round(p.price_egp * 0.006), // ~0.6% monthly mortgage estimate
        date: p.listed_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        ref: p.title || 'Mortgage Payment',
      });
    }
  });

  // Sort newest first
  return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// ── Group by month ───────────────────────────────────────────────
const groupByMonth = (txs: Transaction[]) => {
  const map: Record<string, Transaction[]> = {};
  txs.forEach(tx => {
    const month = new Date(tx.date).toLocaleDateString('en-US', {
      month: 'long', year: 'numeric',
    });
    (map[month] ??= []).push(tx);
  });
  return Object.entries(map).map(([title, data]) => ({ title, data }));
};

// ── Screen ───────────────────────────────────────────────────────
export function TransactionsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [sections, setSections] = useState<{ title: string; data: Transaction[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: sbError } = await supabase
        .from('properties')
        .select('listing_id, title, property_type, offering_type, price_egp, city, listed_date')
        .not('price_egp', 'is', null)
        .order('listed_date', { ascending: false })
        .limit(30);

      if (sbError) throw new Error(sbError.message);

      const txs = deriveTransactions(data || []);
      setSections(groupByMonth(txs));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <ScreenHeader title="Transactions" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={c.secondary} />
          <AppText color="textMuted">Loading transactions...</AppText>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ScreenHeader title="Transactions" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={48} color={c.danger} />
          <AppText color="danger" center style={{ marginTop: 12 }}>{error}</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Transactions" onBack={() => navigation.goBack()} />
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}

        renderSectionHeader={({ section }) => (
          <AppText
            variant="label"
            color="textMuted"
            style={{ marginTop: 16, marginBottom: 8 }}
          >
            {section.title}
          </AppText>
        )}

        renderItem={({ item }) => {
          const positive = item.amount > 0;
          return (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
            }}>
              {/* Icon */}
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: positive ? c.secondaryMuted : c.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons
                  name={ICON[item.type]}
                  size={18}
                  color={positive ? c.secondary : c.textSecondary}
                />
              </View>

              {/* Label + ref */}
              <View style={{ flex: 1 }}>
                <AppText style={{ fontFamily: fonts.semibold, fontSize: 14 }}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </AppText>
                <AppText variant="caption" color="textMuted" numberOfLines={1}>
                  {item.ref} · {item.date}
                </AppText>
              </View>

              {/* Amount */}
              <AppText style={{
                fontFamily: fonts.semibold,
                fontSize: 14,
                color: positive ? c.secondary : c.text,
              }}>
                {formatSigned(item.amount, 'EGP')}
              </AppText>
            </View>
          );
        }}

        ListEmptyComponent={
          <AppText color="textMuted" center style={{ marginTop: 40 }}>
            No transactions found
          </AppText>
        }
      />
    </Screen>
  );
}