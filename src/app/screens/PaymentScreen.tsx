import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../store/authStore';
import {
  PLANS,
  paymentService,
  formatCardNumber,
  formatExpiry,
  isValidCardNumber,
  type PaymentMethod,
} from '../../services/api/paymentService';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

export function PaymentScreen({ route, navigation }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  const plan = PLANS.find((p) => p.id === route.params?.planId) ?? PLANS[0];
  const { subtotal, tax, total } = useMemo(() => paymentService.computeTotal(plan.price), [plan.price]);

  const user = useAuthStore((s) => s.user);
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [holder, setHolder] = useState('');
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [phone, setPhone] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const methods: { key: PaymentMethod; label: string }[] = [
    { key: 'card', label: t('payment.card') },
    { key: 'vodafone', label: t('payment.vodafone') },
    { key: 'fawry', label: t('payment.fawry') },
  ];

  function onSuccess(reference: string) {
    Alert.alert(
      t('payment.success'),
      `${t('payment.successBody', { plan: t(`payment.${plan.name}` as const) })}\n${reference}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  }

  async function pay() {
    setError(null);
    if (method === 'card') {
      if (holder.trim().length < 3) return setError(t('payment.cardHolder'));
      if (!isValidCardNumber(number)) return setError(t('payment.cardNumber'));
      if (expiry.length < 5) return setError(t('payment.expiry'));
      if (cvv.length < 3) return setError(t('payment.cvv'));
    } else if (phone.replace(/\D/g, '').length < 10) {
      return setError(t('payment.phone'));
    }

    const [firstName, ...rest] = (method === 'card' ? holder : user?.fullName ?? '').trim().split(' ');

    setLoading(true);
    try {
      const res = await paymentService.checkout({
        planId: plan.id,
        method,
        billing: { firstName: firstName ?? '', lastName: rest.join(' '), email: user?.email, phone },
      });

      // Demo / simulated charge completes immediately.
      if (!res.paymentUrl) {
        onSuccess(res.reference);
        return;
      }

      // Real Paymob flow → open the hosted page, then confirm status server-side.
      await WebBrowser.openBrowserAsync(res.paymentUrl);
      let status = await paymentService.getStatus(res.reference);
      for (let i = 0; i < 3 && status === 'pending'; i += 1) {
        await new Promise((r) => setTimeout(r, 2000));
        status = await paymentService.getStatus(res.reference);
      }
      if (status === 'succeeded') onSuccess(res.reference);
      else if (status === 'failed') setError(t('payment.failed'));
      else setError(t('payment.pending'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </Pressable>
        <AppText style={{ fontFamily: fonts.heading, fontSize: 17, flex: 1, textAlign: 'center', marginRight: 22 }}>
          {t('payment.title')}
        </AppText>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }} showsVerticalScrollIndicator={false}>
          {/* Selected plan */}
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <AppText style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1, color: c.textMuted }}>
                  {t('payment.selectedPlan')}
                </AppText>
                <AppText style={{ fontFamily: fonts.serif, fontSize: 22, marginTop: 2 }}>
                  {t(`payment.${plan.name}` as const)}
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText style={{ fontFamily: fonts.heading, fontSize: 22, color: c.tertiary }}>${plan.price}</AppText>
                <AppText variant="caption" color="tertiary">{t('payment.perMonth')}</AppText>
              </View>
            </View>
            <View style={{ marginTop: 16, gap: 10 }}>
              {plan.features.map((f) => (
                <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="checkmark-circle" size={18} color={c.secondary} />
                  <AppText style={{ flex: 1, fontFamily: fonts.body, fontSize: 13, color: c.textSecondary }}>
                    {t(`payment.${f}` as const)}
                  </AppText>
                </View>
              ))}
            </View>
          </Card>

          {/* Payment method */}
          <View style={{ gap: 10 }}>
            <AppText style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1, color: c.textMuted }}>
              {t('payment.method')}
            </AppText>
            <View style={{ flexDirection: 'row', backgroundColor: c.surfaceAlt, borderRadius: radius.md, padding: 4 }}>
              {methods.map((m) => {
                const active = method === m.key;
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => setMethod(m.key)}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: radius.sm, backgroundColor: active ? c.surface : 'transparent', alignItems: 'center' }}
                  >
                    <AppText style={{ fontFamily: fonts.semibold, fontSize: 12, color: active ? c.text : c.textMuted }}>{m.label}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Card form OR alt-method hint */}
          {method === 'card' ? (
            <View style={{ gap: 16 }}>
              <Input label={t('payment.cardHolder')} value={holder} onChangeText={setHolder} placeholder={t('payment.cardHolderPlaceholder')} autoCapitalize="characters" />
              <Input
                label={t('payment.cardNumber')}
                value={number}
                onChangeText={(v) => setNumber(formatCardNumber(v))}
                placeholder="4444 4444 4444 4444"
                keyboardType="number-pad"
                icon="card-outline"
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Input label={t('payment.expiry')} value={expiry} onChangeText={(v) => setExpiry(formatExpiry(v))} placeholder="MM/YY" keyboardType="number-pad" />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label={t('payment.cvv')} value={cvv} onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))} placeholder="***" keyboardType="number-pad" password />
                </View>
              </View>
              <Pressable onPress={() => setSaveCard((s) => !s)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    borderWidth: 1.5,
                    borderColor: saveCard ? c.secondary : c.borderStrong,
                    backgroundColor: saveCard ? c.secondary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {saveCard && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <AppText variant="label" color="textSecondary">{t('payment.saveCard')}</AppText>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              <Card tone="alt">
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <Ionicons name="information-circle-outline" size={18} color={c.tertiary} />
                  <AppText style={{ flex: 1, fontFamily: fonts.body, fontSize: 13, color: c.textSecondary }}>
                    {method === 'vodafone' ? t('payment.vodafoneHint') : t('payment.fawryHint')}
                  </AppText>
                </View>
              </Card>
              <Input
                label={t('payment.phone')}
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/[^\d+]/g, ''))}
                placeholder="01000000000"
                keyboardType="phone-pad"
                icon="call-outline"
              />
            </View>
          )}

          {/* Order summary */}
          <View style={{ gap: 10, borderTopWidth: 1, borderTopColor: c.border, paddingTop: 16 }}>
            <Row label={t('payment.subscriptionFee')} value={formatCurrency(subtotal)} muted />
            <Row label={t('payment.serviceTax')} value={formatCurrency(tax)} muted />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <AppText style={{ fontFamily: fonts.heading, fontSize: 18 }}>{t('payment.orderTotal')}</AppText>
              <AppText style={{ fontFamily: fonts.heading, fontSize: 22 }}>{formatCurrency(total)}</AppText>
            </View>
          </View>

          {error && <AppText variant="caption" color="danger">{error}</AppText>}
        </ScrollView>

        {/* Sticky pay button */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 12, backgroundColor: c.background }}>
          <Button label={t('payment.payNow', { amount: formatCurrency(total) })} icon="arrow-forward" onPress={pay} loading={loading} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 10 }}>
            <Ionicons name="lock-closed" size={12} color={c.textMuted} />
            <AppText variant="caption" color="textMuted">{t('payment.secure')}</AppText>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <AppText color={muted ? 'textMuted' : 'text'} variant="label">{label}</AppText>
      <AppText color="secondary" variant="label">{value}</AppText>
    </View>
  );
}