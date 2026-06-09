import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/common/Screen';
import { ScreenHeader } from '../../components/common/Brand';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { MetricCard } from '../../components/analysis/MetaricCard';
import { Loader } from '../../components/common/Loader';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/theme';
import { formatPercent, formatCurrency, formatDate } from '../../utils/formatters';
import { reportService, type GeneratedReport } from '../../services/api/reportService';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Report'>;

export function ReportScreen({ route, navigation }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const c = theme.colors;
  const [report, setReport] = useState<GeneratedReport | null>(null);

  useEffect(() => {
    reportService.generate(route.params.id).then(setReport);
  }, [route.params.id]);

  if (!report) return <Loader label={t('report.generating')} />;

  const recColor = report.recommendation === 'buy' ? c.success : report.recommendation === 'hold' ? c.tertiary : c.danger;
  const recTone = report.recommendation === 'buy' ? 'success' : report.recommendation === 'hold' ? 'warning' : 'danger';
  const m = report.metrics;

  return (
    <Screen>
      <ScreenHeader title={t('report.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 18 }} showsVerticalScrollIndicator={false}>
        <AppText style={{ fontFamily: fonts.serif, fontSize: 24, color: c.secondary }}>{report.title}</AppText>

        {/* Recommendation */}
        <Card>
          <AppText style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1, color: c.textMuted }}>
            {t('report.recommendation')}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons
                name={report.recommendation === 'avoid' ? 'warning' : 'checkmark-circle'}
                size={22}
                color={recColor}
              />
              <AppText style={{ fontFamily: fonts.heading, fontSize: 24, color: recColor }}>
                {t(`report.${report.recommendation}` as const)}
              </AppText>
            </View>
            <Badge label={t('report.confidence', { value: Math.round(report.confidence * 100) })} tone={recTone} />
          </View>
        </Card>

        {/* Summary */}
        <View>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1, color: c.textMuted, marginBottom: 8 }}>
            {t('report.summary')}
          </AppText>
          <Card>
            <AppText style={{ fontFamily: fonts.body, fontSize: 14, lineHeight: 22, color: c.textSecondary }}>
              {report.summary}
            </AppText>
          </Card>
        </View>

        {/* Metrics */}
        <View>
          <AppText style={{ fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1, color: c.textMuted, marginBottom: 10 }}>
            {t('report.keyMetrics')}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <MetricCard label={t('report.grossYield')} value={formatPercent(m.grossRentalYield)} accent={c.secondary} />
            <MetricCard label={t('report.netYield')} value={formatPercent(m.netRentalYield)} accent={c.secondary} />
            <MetricCard label={t('report.capRate')} value={formatPercent(m.capRate)} />
            <MetricCard label={t('report.cashOnCash')} value={formatPercent(m.cashOnCashReturn)} />
            <MetricCard
              label={t('report.monthlyCashFlow')}
              value={formatCurrency(Math.round(m.monthlyCashFlow))}
              accent={m.monthlyCashFlow >= 0 ? c.secondary : c.danger}
            />
            <MetricCard label={t('report.fiveYearRoi')} value={formatPercent(m.fiveYearRoi, 0)} accent={c.secondary} />
          </View>
        </View>

        <AppText variant="caption" color="textMuted" center>
          {t('report.generatedAt', { date: formatDate(report.generatedAt) })}
        </AppText>
      </ScrollView>
    </Screen>
  );
}