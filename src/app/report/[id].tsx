// AI Investment Report viewer — generates (POST /reports) then renders.

import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { ScreenHeader } from '../../components/common/Brand';
import { ReportView } from '../../components/analysis/ReportView';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/theme';
import { useUiStore } from '../../store/uiStore';
import { reportService } from '../../services/api/reportService';
import type { InvestmentReport } from '../../types/report';

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();
  const lang = useUiStore((s) => s.language);

  const [report, setReport] = useState<InvestmentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setReport(await reportService.generate(id, {}, lang));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void generate(); /* eslint-disable-next-line */ }, [id]);

  return (
    <Screen>
      <ScreenHeader title={t('report.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 64, gap: 14 }}>
            <Ionicons name="sparkles" size={40} color={c.secondary} />
            <AppText style={{ fontFamily: fonts.serif, fontSize: 18 }} center>{t('report.generating')}</AppText>
            <AppText color="textMuted" center>{t('report.generatingBody')}</AppText>
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 14 }}>
            <Ionicons name="alert-circle-outline" size={40} color={c.danger} />
            <AppText color="textMuted" center>{error}</AppText>
            <Button label={t('common.retry')} onPress={generate} fullWidth={false} />
          </View>
        ) : report ? (
          <ReportView report={report} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
