// Renders an InvestmentReport: recommendation, risk, metrics, 5-yr trend chart.

import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { AppText } from '../common/Text';
import { Card } from '../common/Card';
import { LineChartCard } from '../Chart';
import { formatPct, formatYears, formatCompact, formatMonthShort } from '../../utils/formatters';
import { RISK_COLORS } from '../../utils/financial';
import type { InvestmentReport } from '../../types/report';
import type { RiskLevel } from '../../types/analysis';

const REC_COLORS: Record<string, string> = { buy: '#0B9972', hold: '#D4850A', avoid: '#C0392B' };

export function ReportView({ report }: { report: InvestmentReport }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const recColor = REC_COLORS[report.recommendation] ?? c.secondary;
  const m = report.metrics;

  return (
    <View style={{ gap: 16 }}>
      {/* Recommendation */}
      <Card style={{ borderColor: recColor, borderWidth: 1.5 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <AppText variant="label" color="textMuted">{t('report.recommendation')}</AppText>
            <AppText style={{ fontFamily: fonts.serif, fontSize: 30, color: recColor }}>
              {t(`report.${report.recommendation}`).toUpperCase()}
            </AppText>
          </View>
          <View style={{ alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 32, backgroundColor: `${recColor}22` }}>
            <AppText style={{ fontFamily: fonts.heading, fontSize: 18, color: recColor }}>{Math.round(report.confidence * 100)}%</AppText>
          </View>
        </View>
        <AppText color="textSecondary" style={{ marginTop: 12, lineHeight: 22 }}>{report.summary}</AppText>
      </Card>

      {/* Key metrics */}
      <View style={{ gap: 10 }}>
        <AppText style={{ fontFamily: fonts.serif, fontSize: 20 }}>{t('report.keyMetrics')}</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <MetricBox label={t('report.grossYield')} value={formatPct(m.grossRentalYield)} c={c} />
          <MetricBox label={t('report.netYield')} value={formatPct(m.netRentalYield)} c={c} />
          <MetricBox label={t('report.capRate')} value={formatPct(m.capRate)} c={c} />
          <MetricBox label={t('report.cashOnCash')} value={formatPct(m.cashOnCashReturn)} c={c} />
          <MetricBox label={t('report.monthlyCashFlow')} value={`${formatCompact(m.monthlyCashFlow)} `} c={c} />
          <MetricBox label={t('report.fiveYearRoi')} value={formatPct(m.fiveYearRoi)} c={c} accent />
          <MetricBox label={t('report.breakEven')} value={formatYears(m.breakEvenYears)} c={c} />
        </View>
      </View>

      {/* Risk */}
      <View style={{ gap: 10 }}>
        <AppText style={{ fontFamily: fonts.serif, fontSize: 20 }}>{t('report.riskLevel')}</AppText>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <RiskPill level={report.risk.overall} />
            <AppText color="textMuted">{t('report.riskScore', { score: report.risk.score })}</AppText>
          </View>
          <View style={{ gap: 10 }}>
            {report.risk.factors?.map((f, i) => (
              <View key={i} style={{ gap: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <AppText style={{ fontFamily: fonts.semibold, fontSize: 13 }}>{f.name}</AppText>
                  <RiskPill level={f.level} small />
                </View>
                <AppText variant="caption" color="textMuted">{f.explanation}</AppText>
              </View>
            ))}
          </View>
        </Card>
      </View>

      {/* 5-year trend */}
      {report.marketTrends?.length > 0 && (
        <Card>
          <LineChartCard
            title={t('report.trend')}
            labels={report.marketTrends.map((p) => formatMonthShort(p.period))}
            data={report.marketTrends.map((p) => p.medianPrice)}
            formatY={(n) => formatCompact(n)}
          />
        </Card>
      )}

      {/* Sources */}
      {report.sources?.length > 0 && (
        <View style={{ gap: 6 }}>
          <AppText variant="label" color="textMuted">{t('report.sources')}</AppText>
          {report.sources.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="link-outline" size={13} color={c.textMuted} />
              <AppText variant="caption" color="textSecondary" style={{ flex: 1 }}>{s}</AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function MetricBox({ label, value, c, accent }: { label: string; value: string; c: { surface: string; border: string; secondary: string; tertiary: string }; accent?: boolean }) {
  return (
    <View style={{ width: '47%', flexGrow: 1, padding: 14, borderRadius: radius.md, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }}>
      <AppText style={{ fontFamily: fonts.heading, fontSize: 18, color: accent ? c.tertiary : c.secondary }}>{value}</AppText>
      <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>{label}</AppText>
    </View>
  );
}

export function RiskPill({ level, small }: { level: RiskLevel; small?: boolean }) {
  const { t } = useTranslation();
  const color = RISK_COLORS[level] ?? '#888';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: `${color}22`, borderRadius: radius.pill, paddingHorizontal: small ? 8 : 12, paddingVertical: small ? 3 : 6 }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
      <AppText style={{ fontFamily: fonts.semibold, fontSize: small ? 11 : 13, color }}>{t(`risk.${level}`)}</AppText>
    </View>
  );
}
