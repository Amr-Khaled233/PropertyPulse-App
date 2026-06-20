// Investment Reports — the user's saved reports (GET /reports), with delete.

import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { ScreenHeader } from '../../components/common/Brand';
import { InlineLoader } from '../../components/common/Loader';
import { useTheme } from '../../theme/ThemeProvider';
import { reportService } from '../../services/api/reportService';
import { formatDate } from '../../utils/formatters';
import type { InvestmentReport, Recommendation } from '../../types/report';

const REC_TONE: Record<Recommendation, 'success' | 'warning' | 'danger'> = {
  buy: 'success',
  hold: 'warning',
  avoid: 'danger',
};

export default function ReportsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();

  const [reports, setReports] = useState<InvestmentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setReports(await reportService.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  function confirmDelete(report: InvestmentReport) {
    Alert.alert(t('report.deleteConfirm'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('report.delete'),
        style: 'destructive',
        onPress: async () => {
          setReports((prev) => prev.filter((r) => r.id !== report.id)); // optimistic
          try {
            await reportService.remove(report.id);
          } catch {
            void load(); // revert by reloading
          }
        },
      },
    ]);
  }

  return (
    <Screen>
      <ScreenHeader title={t('report.myReports')} onBack={() => router.back()} />
      {loading ? (
        <InlineLoader />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 14, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            error ? (
              <AppText variant="caption" color="danger" center>{error}</AppText>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: c.secondaryMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="document-text-outline" size={28} color={c.secondary} />
                </View>
                <AppText color="textMuted" center>{t('report.empty')}</AppText>
              </View>
            )
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/reports/${item.id}`)}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Badge label={t(`report.${item.recommendation}`)} tone={REC_TONE[item.recommendation]} solid />
                  <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={20} color={c.danger} />
                  </Pressable>
                </View>
                <AppText color="textSecondary" numberOfLines={2} style={{ lineHeight: 20 }}>{item.summary}</AppText>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <AppText variant="caption" color="textMuted">
                    {t('report.confidenceLabel', { value: Math.round(item.confidence * 100) })}
                  </AppText>
                  <AppText variant="caption" color="textMuted">{formatDate(item.generatedAt)}</AppText>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
