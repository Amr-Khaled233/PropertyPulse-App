import { useState, useEffect } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/common/Screen';
import { ScreenHeader } from '../../components/common/Brand';
import { AppText } from '../../components/common/Text';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/theme';
import { supabase } from '../../services/supabase/supabaseClient';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  icon: string;
  time: string;
  unread: boolean;
}

export function NotificationsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const c = theme.colors;
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        const notifications: AppNotification[] = (data || []).map((n: any) => ({
          id: n.id,
          title: n.title,
          body: n.message || n.body,
          icon: n.icon_name || 'notifications-outline',
          time: new Date(n.created_at).toLocaleString(),
          unread: !n.read_at,
        }));

        setItems(notifications);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      const unreadIds = items.filter(n => n.unread).map(n => n.id);
      if (unreadIds.length === 0) return;

      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

      setItems(prev => prev.map(n => ({ ...n, unread: false })));
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);

      setItems(prev => prev.map(n => (n.id === id ? { ...n, unread: false } : n)));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <ScreenHeader title={t('notifications.title')} onBack={() => navigation.goBack()} />
        <Pressable onPress={markAllAsRead} style={{ paddingHorizontal: 20 }}>
          <AppText variant="label" color="secondary">{t('notifications.markAll')}</AppText>
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 20, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {}}
        scrollEnabled={true}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => markAsRead(item.id)}
            style={{ flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border }}
          >
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: c.secondaryMuted, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={c.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AppText style={{ fontFamily: fonts.semibold, fontSize: 14 }}>{item.title}</AppText>
                {item.unread && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.secondary }} />}
              </View>
              <AppText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>{item.body}</AppText>
              <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>{item.time}</AppText>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading && <AppText color="textMuted" style={{ textAlign: 'center', marginTop: 40 }}>{t('notifications.empty')}</AppText>
        }
      />
    </Screen>
  );
}