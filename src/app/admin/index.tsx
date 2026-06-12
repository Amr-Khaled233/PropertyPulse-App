// Admin dashboard — property CRUD + inquiries CRM + users. Admin-only.

import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Chip } from '../../components/common/Chip';
import { ScreenHeader } from '../../components/common/Brand';
import { InlineLoader } from '../../components/common/Loader';
import { PropertyFormModal } from '../../components/admin/PropertyFormModal';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { useAuthStore } from '../../store/authStore';
import { propertyService } from '../../services/api/propertyService';
import { adminService } from '../../services/api/adminService';
import { formatCompactCurrency } from '../../utils/formatters';
import type { Property } from '../../types/listing';
import type { Inquiry, InquiryStatus } from '../../types/inquiry';
import type { UserProfile } from '../../types/user';

type Tab = 'properties' | 'inquiries' | 'users';
const STATUSES: InquiryStatus[] = ['new', 'in_progress', 'closed'];

export default function AdminScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [tab, setTab] = useState<Tab>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    try { setProperties((await propertyService.search({ pageSize: 30 })).items); } finally { setLoading(false); }
  }, []);
  const loadInquiries = useCallback(async () => {
    setLoading(true);
    try { setInquiries(await adminService.listInquiries()); } catch { setInquiries([]); } finally { setLoading(false); }
  }, []);
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try { setUsers(await adminService.listUsers()); } catch { setUsers([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'properties') void loadProperties();
    else if (tab === 'inquiries') void loadInquiries();
    else void loadUsers();
  }, [tab, loadProperties, loadInquiries, loadUsers]);

  function deleteProperty(p: Property) {
    Alert.alert(t('admin.deleteTitle'), p.title, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('admin.delete'), style: 'destructive', onPress: async () => { await adminService.deleteProperty(p.id); void loadProperties(); } },
    ]);
  }

  async function cycleStatus(inq: Inquiry) {
    const next = STATUSES[(STATUSES.indexOf(inq.status) + 1) % STATUSES.length];
    try {
      await adminService.setInquiryStatus(inq.id, next);
      setInquiries((prev) => prev.map((i) => (i.id === inq.id ? { ...i, status: next } : i)));
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : '');
    }
  }

  if (user?.role !== 'admin') {
    return (
      <Screen>
        <ScreenHeader title={t('admin.title')} onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 }}>
          <Ionicons name="lock-closed-outline" size={40} color={c.textMuted} />
          <AppText color="textMuted" center>{t('admin.noAccess')}</AppText>
        </View>
      </Screen>
    );
  }

  const tones: Record<InquiryStatus, 'warning' | 'info' | 'success'> = { new: 'warning', in_progress: 'info', closed: 'success' };

  return (
    <Screen>
      <ScreenHeader title={t('admin.title')} onBack={() => router.back()} />
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 8 }}>
        <Chip label={t('admin.properties')} selected={tab === 'properties'} onPress={() => setTab('properties')} />
        <Chip label={t('admin.inquiries')} selected={tab === 'inquiries'} onPress={() => setTab('inquiries')} />
        <Chip label={t('admin.users')} selected={tab === 'users'} onPress={() => setTab('users')} />
      </View>

      {tab === 'properties' && (
        <FlatList
          data={properties}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12, paddingBottom: 32 }}
          ListHeaderComponent={
            <Button label={t('admin.newProperty')} icon="add" onPress={() => { setEditing(null); setFormOpen(true); }} style={{ marginBottom: 8 }} />
          }
          ListEmptyComponent={loading ? <InlineLoader /> : <AppText color="textMuted" center>—</AppText>}
          renderItem={({ item }) => (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <AppText numberOfLines={1} style={{ fontFamily: fonts.semibold }}>{item.title}</AppText>
                  <AppText variant="caption" color="textMuted">{formatCompactCurrency(item.price, item.currency)} · {item.address?.city}</AppText>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                    <Badge label={item.type} tone="info" />
                    {item.featured && <Badge label={t('admin.featured')} tone="warning" />}
                  </View>
                </View>
                <View style={{ gap: 8 }}>
                  <Pressable onPress={() => { setEditing(item); setFormOpen(true); }} hitSlop={6}><Ionicons name="create-outline" size={22} color={c.secondary} /></Pressable>
                  <Pressable onPress={() => deleteProperty(item)} hitSlop={6}><Ionicons name="trash-outline" size={22} color={c.danger} /></Pressable>
                </View>
              </View>
            </Card>
          )}
        />
      )}

      {tab === 'inquiries' && (
        <FlatList
          data={inquiries}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12, paddingBottom: 32 }}
          ListEmptyComponent={loading ? <InlineLoader /> : <AppText color="textMuted" center>{t('admin.noInquiries')}</AppText>}
          renderItem={({ item }) => (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <AppText style={{ fontFamily: fonts.semibold }}>{item.name}</AppText>
                <Pressable onPress={() => cycleStatus(item)}><Badge label={item.status.replace('_', ' ')} tone={tones[item.status]} solid /></Pressable>
              </View>
              <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>{[item.email, item.phone].filter(Boolean).join(' · ')}</AppText>
              {item.message ? <AppText color="textSecondary" style={{ marginTop: 8 }}>{item.message}</AppText> : null}
              <AppText variant="caption" color="textMuted" style={{ marginTop: 8 }}>{item.kind.replace('_', ' ')}</AppText>
            </Card>
          )}
        />
      )}

      {tab === 'users' && (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 10, paddingBottom: 32 }}
          ListEmptyComponent={loading ? <InlineLoader /> : <AppText color="textMuted" center>—</AppText>}
          renderItem={({ item }) => (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontFamily: fonts.semibold }}>{item.fullName ?? item.email}</AppText>
                  <AppText variant="caption" color="textMuted">{item.email}</AppText>
                </View>
                <Badge label={item.role} tone={item.role === 'admin' ? 'success' : 'neutral'} />
              </View>
            </Card>
          )}
        />
      )}

      <PropertyFormModal visible={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSaved={loadProperties} />
    </Screen>
  );
}
