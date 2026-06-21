// Role-aware notifications. Admin → new inquiries + new users; investor →
// admin updates on their own inquiries (incl. removed). Opening the screen marks
// everything seen so the bell badge clears.

import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../components/common/Screen';
import { AppText } from '../components/common/Text';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ScreenHeader } from '../components/common/Brand';
import { InlineLoader } from '../components/common/Loader';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/theme';
import { useAuthStore } from '../store/authStore';
import { getFeed, markSeen, type NotifItem, type NotifRole } from '../services/api/notifFeed';
import type { InquiryStatus } from '../types/inquiry';

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();
  const role: NotifRole = useAuthStore((s) => s.user?.role) === 'admin' ? 'admin' : 'investor';

  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const feed = await getFeed(role);
    setItems(feed);
    setLoading(false);
    await markSeen(feed, role); // opening the screen clears the badge
  }, [role]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const statusTone = (s: InquiryStatus): 'info' | 'warning' | 'success' | 'danger' =>
    s === 'new' ? 'info' : s === 'in_progress' ? 'warning' : s === 'closed' ? 'success' : 'danger';

  return (
    <Screen>
      <ScreenHeader title={t('notif.title')} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.secondary} />}
      >
        {loading ? (
          <InlineLoader />
        ) : items.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: c.secondaryMuted, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="notifications-outline" size={28} color={c.secondary} />
            </View>
            <AppText color="textMuted" center>{t('notif.empty')}</AppText>
          </View>
        ) : (
          items.map((it) => (
            <Card key={it.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <AppText style={{ fontFamily: fonts.semibold, fontSize: 14, flex: 1 }}>{t(it.titleKey)}</AppText>
                {it.tag && <Badge label={t(`notif.tag.${it.tag}`)} tone={it.tag === 'inquiry' ? 'info' : 'success'} />}
                {it.status && <Badge label={t(`notif.status.${it.status}`)} tone={statusTone(it.status)} solid={it.status !== 'new'} />}
              </View>
              {it.detail ? (
                <AppText color="textSecondary" style={{ marginTop: 6, lineHeight: 20 }} numberOfLines={3}>{it.detail}</AppText>
              ) : null}
              {it.status === 'deleted' && (
                <AppText variant="caption" color="danger" style={{ marginTop: 6 }}>{t('notif.removed')}</AppText>
              )}
              <AppText variant="caption" color="textMuted" style={{ marginTop: 8 }}>{shortDate(it.date)}</AppText>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
