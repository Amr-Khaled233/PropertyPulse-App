// Notifications screen — shows admin status updates on user's inquiries.

import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/common/Screen';
import { AppText } from '../components/common/Text';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ScreenHeader } from '../components/common/Brand';
import { InlineLoader } from '../components/common/Loader';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radius } from '../theme/theme';
import { inquiryService } from '../services/api/inquiryService';
import type { Inquiry, InquiryStatus } from '../types/inquiry';

const KIND_LABEL: Record<string, string> = {
  buyer_inquiry: 'Buyer Inquiry',
  viewing_request: 'Viewing Request',
  contact_message: 'Contact Message',
  application: 'Application',
};

function statusTone(status: InquiryStatus): 'info' | 'warning' | 'success' {
  if (status === 'new') return 'info';
  if (status === 'in_progress') return 'warning';
  return 'success';
}

function statusLabel(status: InquiryStatus): string {
  if (status === 'new') return 'New';
  if (status === 'in_progress') return 'In Progress';
  return 'Closed';
}

function statusIcon(status: InquiryStatus): 'time-outline' | 'refresh-circle-outline' | 'checkmark-circle-outline' {
  if (status === 'new') return 'time-outline';
  if (status === 'in_progress') return 'refresh-circle-outline';
  return 'checkmark-circle-outline';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await inquiryService.getMyInquiries();
      setInquiries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <Screen>
      <ScreenHeader title="Notifications" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 14, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.secondary} />}
      >
        {loading ? (
          <InlineLoader />
        ) : error ? (
          <AppText variant="caption" color="danger">{error}</AppText>
        ) : inquiries.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: c.secondaryMuted, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="notifications-outline" size={28} color={c.secondary} />
            </View>
            <AppText style={{ fontFamily: fonts.serif, fontSize: 18 }} center>No notifications yet</AppText>
            <AppText color="textMuted" center>When an admin updates the status of your inquiries, you'll see them here.</AppText>
          </View>
        ) : (
          inquiries.map((inq) => (
            <Card key={inq.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <AppText style={{ fontFamily: fonts.semibold, fontSize: 15 }}>
                    {KIND_LABEL[inq.kind] ?? inq.kind}
                  </AppText>
                  <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                    {formatDate(inq.createdAt)}
                  </AppText>
                </View>
                <Badge
                  label={statusLabel(inq.status)}
                  tone={statusTone(inq.status)}
                  icon={statusIcon(inq.status)}
                  solid={inq.status !== 'new'}
                />
              </View>

              {inq.message && (
                <AppText color="textSecondary" style={{ fontSize: 13, lineHeight: 20, marginBottom: 10 }} numberOfLines={3}>
                  {inq.message}
                </AppText>
              )}

              <View style={{ height: 1, backgroundColor: c.border, marginBottom: 10 }} />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: radius.sm,
                    backgroundColor: inq.status === 'closed' ? `${c.success}22` : inq.status === 'in_progress' ? `${c.tertiary}22` : c.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={statusIcon(inq.status)}
                    size={16}
                    color={inq.status === 'closed' ? c.success : inq.status === 'in_progress' ? c.tertiary : c.textMuted}
                  />
                </View>
                <AppText color="textSecondary" style={{ fontSize: 13 }}>
                  {inq.status === 'new' && 'Your request has been received and is pending review.'}
                  {inq.status === 'in_progress' && 'An agent is currently handling your request.'}
                  {inq.status === 'closed' && 'Your request has been resolved and closed.'}
                </AppText>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
