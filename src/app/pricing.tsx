// Pricing & subscription — plan selection + Stripe checkout (expo-web-browser).

import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/common/Screen';
import { AppText } from '../components/common/Text';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ScreenHeader } from '../components/common/Brand';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radius } from '../theme/theme';
import { useAuthStore } from '../store/authStore';
import { paymentService, type PlanId } from '../services/api/paymentService';

const VAT_RATE = 0.14;
const CURRENCY = 'EGP';

interface Plan {
  id: PlanId;
  tier: string;
  name: string;
  price: number;
  cadence: string;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  { id: 'free', tier: 'Base', name: 'Free', price: 0, cadence: 'Forever free', features: ['Basic search', '3 AI reports / month', 'Limited market data'] },
  { id: 'pro', tier: 'Elevate', name: 'Pro', price: 850, cadence: 'per month', popular: true, features: ['Unlimited AI reports', 'Full AI advisor', 'Real-time trends', 'Portfolio tools'] },
  { id: 'enterprise', tier: 'Scale', name: 'Enterprise', price: 2400, cadence: 'per month', features: ['Team collaboration', 'API access', 'Custom AI engine', 'Priority manager'] },
];

export default function PricingScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [selectedId, setSelectedId] = useState<PlanId>('pro');
  const [processing, setProcessing] = useState(false);

  const selected = PLANS.find((p) => p.id === selectedId) ?? PLANS[1];
  const vat = Math.round(selected.price * VAT_RATE);
  const total = selected.price + vat;
  const money = (n: number) => `${CURRENCY} ${n.toLocaleString()}`;

  async function subscribe() {
    if (selected.price === 0) return;
    setProcessing(true);
    try {
      const checkout = await paymentService.startCheckout(selected.id);
      if (checkout.url) {
        // Open Stripe Checkout; finalize on return (test mode).
        await WebBrowser.openBrowserAsync(checkout.url);
      }
      const res = await paymentService.subscribe({ plan: selected.id, amount: total, currency: CURRENCY });
      if (user) setUser({ ...user, plan: res.plan ?? selected.id });
      Alert.alert(t('pricing.successTitle'), t('pricing.successBody', { plan: selected.name }));
    } catch (e) {
      Alert.alert(t('pricing.failedTitle'), e instanceof Error ? e.message : t('pricing.failedBody'));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title={t('pricing.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <AppText color="textMuted">{t('pricing.subtitle')}</AppText>

        {PLANS.map((plan) => {
          const active = selectedId === plan.id;
          const current = user?.plan === plan.id || (!user?.plan && plan.id === 'free');
          return (
            <Pressable key={plan.id} onPress={() => setSelectedId(plan.id)}>
              <Card style={active ? { borderColor: c.secondary, borderWidth: 2 } : undefined}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View>
                    <AppText variant="label" color="textMuted" style={{ letterSpacing: 1 }}>{plan.tier.toUpperCase()}</AppText>
                    <AppText style={{ fontFamily: fonts.serif, fontSize: 22 }}>{plan.name}</AppText>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {plan.popular && <Badge label={t('pricing.popular')} tone="success" solid />}
                    {current && <Badge label={t('pricing.current')} tone="info" />}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 8 }}>
                  <AppText style={{ fontFamily: fonts.heading, fontSize: 26, color: c.secondary }}>{plan.price === 0 ? t('pricing.free') : money(plan.price)}</AppText>
                  <AppText color="textMuted" style={{ marginBottom: 4 }}>{plan.price === 0 ? '' : `/ ${plan.cadence}`}</AppText>
                </View>
                <View style={{ gap: 8, marginTop: 12 }}>
                  {plan.features.map((f) => (
                    <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="checkmark-circle" size={16} color={c.secondary} />
                      <AppText color="textSecondary" style={{ fontSize: 13 }}>{f}</AppText>
                    </View>
                  ))}
                </View>
              </Card>
            </Pressable>
          );
        })}

        {/* Checkout summary */}
        <Card tone="alt">
          <AppText style={{ fontFamily: fonts.serif, fontSize: 18, marginBottom: 12 }}>{t('pricing.checkout')}</AppText>
          <Row label={t('pricing.subtotal')} value={money(selected.price)} c={c} />
          <Row label={t('pricing.vat')} value={money(vat)} c={c} />
          <View style={{ height: 1, backgroundColor: c.border, marginVertical: 10 }} />
          <Row label={t('pricing.total')} value={money(total)} c={c} bold />
          <Button
            label={processing ? t('common.loading') : selected.price === 0 ? t('pricing.current') : t('pricing.payStripe')}
            onPress={subscribe}
            loading={processing}
            disabled={selected.price === 0}
            style={{ marginTop: 16 }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
            <Ionicons name="lock-closed" size={13} color={c.textMuted} />
            <AppText variant="caption" color="textMuted">{t('pricing.secured')}</AppText>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value, c, bold }: { label: string; value: string; c: { text: string }; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 }}>
      <AppText color={bold ? 'text' : 'textMuted'} style={bold ? { fontFamily: fonts.semibold } : undefined}>{label}</AppText>
      <AppText style={{ fontFamily: bold ? fonts.heading : fonts.medium, color: c.text }}>{value}</AppText>
    </View>
  );
}
