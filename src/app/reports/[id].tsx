// View a saved investment report by id (GET /reports/:id) → ReportView.

import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { ScreenHeader } from '../../components/common/Brand';
import { Loader } from '../../components/common/Loader';
import { ReportView } from '../../components/analysis/ReportView';
import { useTheme } from '../../theme/ThemeProvider';
import { reportService } from '../../services/api/reportService';
import type { InvestmentReport } from '../../types/report';

export default function SavedReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();

  const [report, setReport] = useState<InvestmentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    reportService
      .getById(id)
      .then(setReport)
      .catch((e) => setError(e instanceof Error ? e.message : 'Not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;

  return (
    <Screen>
      <ScreenHeader title={t('report.title')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {error || !report ? (
          <View style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
            <Ionicons name="alert-circle-outline" size={40} color={c.danger} />
            <AppText color="textMuted" center>{error ?? t('common.error')}</AppText>
          </View>
        ) : (
          <ReportView report={report} />
        )}
      </ScrollView>
    </Screen>
  );
}
