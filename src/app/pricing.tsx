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
import { makeRedirectUri } from 'expo-auth-session';
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

export default function PricingScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const currentPlan: PlanId = (user?.plan as PlanId) ?? 'free';

  // Plans are rebuilt from the active language so names/features/cadence localize.
  const PLANS: Plan[] = [
    { id: 'free', tier: t('pricing.freeTier'), name: t('plan.free'), price: 0, cadence: t('pricing.freeCadence'), features: t('pricing.freeFeatures', { returnObjects: true }) as string[] },
    { id: 'pro', tier: t('pricing.proTier'), name: t('plan.pro'), price: 850, cadence: t('pricing.proCadence'), popular: true, features: t('pricing.proFeatures', { returnObjects: true }) as string[] },
  ];

  const [selectedId, setSelectedId] = useState<PlanId>('pro');
  const [processing, setProcessing] = useState(false);

  const selected = PLANS.find((p) => p.id === selectedId) ?? PLANS[1];
  const isCurrentSelected = selected.id === currentPlan;
  const vat = Math.round(selected.price * VAT_RATE);
  const total = selected.price + vat;
  const money = (n: number) => `${CURRENCY} ${n.toLocaleString()}`;

  // After any successful upgrade: refresh the profile (so PRO shows app-wide),
  // confirm to the user, and land them on Profile.
  async function onUpgraded(plan: PlanId) {
    await refreshProfile();
    const name = PLANS.find((p) => p.id === plan)?.name ?? plan;
    Alert.alert(t('pricing.successTitle'), t('pricing.successBody', { plan: name }));
    router.replace('/profile');
  }

  async function subscribe() {
    if (isCurrentSelected || selected.price === 0) return;
    setProcessing(true);
    try {
      const returnUrl = makeRedirectUri({ scheme: 'propertypulse', path: 'pricing' });
      const checkout = await paymentService.startCheckout(selected.id, returnUrl);

      // Simulated gateway (Stripe off) → upgrade directly.
      if (checkout.simulated || !checkout.url || !checkout.sessionId) {
        await paymentService.subscribe({ plan: selected.id, amount: total, currency: CURRENCY });
        await onUpgraded(selected.id);
        return;
      }

      // Real Stripe: open Checkout, then intercept the redirect back to the app.
      const result = await WebBrowser.openAuthSessionAsync(checkout.url, returnUrl);
      if (result.type !== 'success' || !result.url) return; // dismissed / cancelled
      const back = new URL(result.url);
      if (back.searchParams.get('canceled')) return;
      const sessionId = back.searchParams.get('session_id') ?? checkout.sessionId;
      const res = await paymentService.confirm(sessionId);
      await onUpgraded(res.plan ?? selected.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'Payment not completed') return; // cancelled mid-flow
      Alert.alert(t('pricing.failedTitle'), msg || t('pricing.failedBody'));
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
            label={isCurrentSelected ? t('pricing.current') : selected.price === 0 ? t('pricing.free') : t('pricing.payStripe')}
            onPress={subscribe}
            loading={processing}
            disabled={processing || isCurrentSelected || selected.price === 0}
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
