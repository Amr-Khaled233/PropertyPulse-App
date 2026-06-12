// AI Analysis hub for one property: AI report, negotiation tips, financing.

import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Chip } from '../../components/common/Chip';
import { ScreenHeader } from '../../components/common/Brand';
import { InlineLoader } from '../../components/common/Loader';
import { ReportView } from '../../components/analysis/ReportView';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { useUiStore } from '../../store/uiStore';
import { reportService } from '../../services/api/reportService';
import { analysisService, type NegotiationResult } from '../../services/api/analysisService';
import { propertyService } from '../../services/api/propertyService';
import { buildAssumptions, computeInvestmentMetrics, estimateMonthlyRent, monthlyMortgagePayment } from '../../utils/financial';
import { formatCompact, formatPct } from '../../utils/formatters';
import type { InvestmentReport } from '../../types/report';
import type { Property } from '../../types/listing';

type Tab = 'report' | 'negotiation' | 'financing';

export default function AnalysisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();
  const lang = useUiStore((s) => s.language);

  const [tab, setTab] = useState<Tab>('report');
  const [property, setProperty] = useState<Property | null>(null);

  // Report
  const [report, setReport] = useState<InvestmentReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Negotiation
  const [nego, setNego] = useState<NegotiationResult | null>(null);
  const [negoLoading, setNegoLoading] = useState(false);
  const [negoError, setNegoError] = useState<string | null>(null);

  useEffect(() => {
    if (id) propertyService.getById(id).then(setProperty).catch(() => {});
  }, [id]);

  async function genReport() {
    if (!id) return;
    setReportLoading(true);
    setReportError(null);
    try {
      setReport(await reportService.generate(id, {}, lang));
    } catch (e) {
      setReportError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setReportLoading(false);
    }
  }

  async function genNego() {
    if (!id) return;
    setNegoLoading(true);
    setNegoError(null);
    try {
      setNego(await analysisService.negotiation(id, lang));
    } catch (e) {
      setNegoError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setNegoLoading(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title={t('analysis.title')} onBack={() => router.back()} />
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 8 }}>
        <Chip label={t('analysis.report')} selected={tab === 'report'} onPress={() => setTab('report')} />
        <Chip label={t('analysis.negotiation')} selected={tab === 'negotiation'} onPress={() => setTab('negotiation')} />
        <Chip label={t('analysis.financing')} selected={tab === 'financing'} onPress={() => setTab('financing')} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {tab === 'report' && (
          reportLoading ? (
            <Loading c={c} title={t('report.generating')} body={t('report.generatingBody')} />
          ) : report ? (
            <ReportView report={report} />
          ) : (
            <Empty
              icon="sparkles"
              title={t('analysis.reportTitle')}
              body={t('analysis.reportBody')}
              cta={t('detail.generateReport')}
              onPress={genReport}
              error={reportError}
            />
          )
        )}

        {tab === 'negotiation' && (
          negoLoading ? (
            <InlineLoader />
          ) : nego ? (
            <NegotiationView nego={nego} c={c} t={t} />
          ) : (
            <Empty
              icon="trending-down-outline"
              title={t('analysis.negoTitle')}
              body={t('analysis.negoBody')}
              cta={t('analysis.getTips')}
              onPress={genNego}
              error={negoError}
            />
          )
        )}

        {tab === 'financing' && property && <FinancingScenarios property={property} c={c} t={t} />}
        {tab === 'financing' && !property && <InlineLoader />}
      </ScrollView>
    </Screen>
  );
}

function Loading({ c, title, body }: { c: { secondary: string }; title: string; body: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 56, gap: 14 }}>
      <Ionicons name="sparkles" size={40} color={c.secondary} />
      <AppText style={{ fontFamily: fonts.serif, fontSize: 18 }} center>{title}</AppText>
      <AppText color="textMuted" center>{body}</AppText>
    </View>
  );
}

function Empty({ icon, title, body, cta, onPress, error }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; cta: string; onPress: () => void; error: string | null }) {
  const { theme } = useTheme();
  return (
    <Card>
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 12 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.secondaryMuted, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={26} color={theme.colors.secondary} />
        </View>
        <AppText style={{ fontFamily: fonts.serif, fontSize: 20 }} center>{title}</AppText>
        <AppText color="textMuted" center>{body}</AppText>
        {error && <AppText variant="caption" color="danger" center>{error}</AppText>}
        <Button label={cta} icon="sparkles" onPress={onPress} style={{ marginTop: 4 }} />
      </View>
    </Card>
  );
}

function NegotiationView({ nego, c, t }: { nego: NegotiationResult; c: { secondary: string; tertiary: string; surface: string; border: string }; t: (k: string, o?: Record<string, unknown>) => string }) {
  return (
    <View style={{ gap: 16 }}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Stat label={t('analysis.askingPrice')} value={`${formatCompact(nego.askingPrice)} ${nego.currency}`} />
          <Stat label={t('analysis.fairValue')} value={`${formatCompact(nego.fairValue)} ${nego.currency}`} accent />
        </View>
        <View style={{ height: 1, backgroundColor: c.border, marginVertical: 14 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Stat label={t('analysis.suggestedOffer')} value={`${formatCompact(nego.suggestedOffer)} ${nego.currency}`} accent />
          <Stat label={t('analysis.vsMarket')} value={`${nego.deltaPct > 0 ? '+' : ''}${nego.deltaPct.toFixed(1)}%`} />
        </View>
      </Card>
      <AppText color="textSecondary" style={{ lineHeight: 22 }}>{nego.summary}</AppText>
      <View style={{ gap: 10 }}>
        {nego.tips?.map((tip, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
            <Ionicons name="checkmark-circle" size={18} color={c.secondary} style={{ marginTop: 1 }} />
            <AppText color="textSecondary" style={{ flex: 1, lineHeight: 21 }}>{tip}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function FinancingScenarios({ property, c, t }: { property: Property; c: { secondary: string; tertiary: string; surface: string; border: string }; t: (k: string, o?: Record<string, unknown>) => string }) {
  const rent = estimateMonthlyRent(property.areaSqm, property.type);
  const scenarios = useMemo(() => {
    const make = (key: string, label: string, over: { downPaymentPct: number; loanInterestRate: number; loanTermYears: number }) => {
      const a = buildAssumptions(property.price, { monthlyRent: rent, ...over });
      const m = computeInvestmentMetrics(a);
      const loan = a.purchasePrice - a.purchasePrice * (a.downPaymentPct / 100);
      const monthly = monthlyMortgagePayment(loan, a.loanInterestRate, a.loanTermYears);
      return { key, label, down: a.purchasePrice * (a.downPaymentPct / 100), monthly, roi: m.fiveYearRoi, cashFlow: m.monthlyCashFlow, termYears: over.loanTermYears };
    };
    return [
      make('cash', t('analysis.cash'), { downPaymentPct: 100, loanInterestRate: 0, loanTermYears: 1 }),
      make('installments', t('analysis.installments'), { downPaymentPct: 40, loanInterestRate: 0, loanTermYears: 6 }),
      make('mortgage', t('analysis.mortgage'), { downPaymentPct: 20, loanInterestRate: 6.5, loanTermYears: 20 }),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.id]);

  return (
    <View style={{ gap: 14 }}>
      <AppText color="textMuted">{t('analysis.financingBody')}</AppText>
      {scenarios.map((s) => (
        <Card key={s.key}>
          <AppText style={{ fontFamily: fonts.serif, fontSize: 18, marginBottom: 10 }}>{s.label}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <Stat label={t('analysis.downPayment')} value={`${formatCompact(s.down)} ${property.currency}`} />
            <Stat label={t('analysis.monthlyPayment')} value={s.monthly > 0 ? `${formatCompact(s.monthly)} ${property.currency}` : '—'} />
            <Stat label={t('analysis.term')} value={s.key === 'cash' ? t('analysis.oneTime') : t('analysis.years', { count: s.termYears })} />
            <Stat label={t('analysis.monthlyCashFlow')} value={`${formatCompact(s.cashFlow)} ${property.currency}`} />
            <Stat label={t('report.fiveYearRoi')} value={formatPct(s.roi)} accent />
          </View>
        </Card>
      ))}
    </View>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={{ minWidth: '44%', flexGrow: 1 }}>
      <AppText style={{ fontFamily: fonts.heading, fontSize: 17, color: accent ? theme.colors.tertiary : theme.colors.text }}>{value}</AppText>
      <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>{label}</AppText>
    </View>
  );
}
