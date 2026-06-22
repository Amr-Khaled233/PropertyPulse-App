// Admin dashboard — property CRUD + inquiries CRM + users. Admin-only.

import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
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
import { useUiStore } from '../../store/uiStore';
import { applyLanguage } from '../../i18';
import { propertyService } from '../../services/api/propertyService';
import { adminService } from '../../services/api/adminService';
import { getFeed, countUnseen } from '../../services/api/notifFeed';
import { formatCompactCurrency } from '../../utils/formatters';
import type { Property } from '../../types/listing';
import type { Inquiry, InquiryStatus } from '../../types/inquiry';
import type { UserProfile, PlanTier } from '../../types/user';

type Tab = 'properties' | 'inquiries' | 'users';
const STATUSES: InquiryStatus[] = ['new', 'in_progress', 'closed'];

export default function AdminScreen() {
  const { theme, isDark, setPreference } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);

  async function toggleLang() {
    const next = language === 'ar' ? 'en' : 'ar';
    setLanguage(next);
    const { rtlChanged } = await applyLanguage(next);
    if (rtlChanged) Alert.alert(t('profile.rtlTitle'), t('profile.rtlBody'));
  }
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  function confirmSignOut() {
    Alert.alert(t('auth.signOut'), t('profile.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('auth.signOut'), style: 'destructive', onPress: async () => { await signOut(); router.replace('/landing'); } },
    ]);
  }

  const [tab, setTab] = useState<Tab>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);
  const [adminNotif, setAdminNotif] = useState(0);

  const refreshBadge = useCallback(async () => {
    try {
      setAdminNotif(await countUnseen(await getFeed('admin'), 'admin'));
    } catch {
      /* badge is best-effort */
    }
  }, []);

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

  useEffect(() => {
    const id = setInterval(() => void refreshBadge(), 60000);
    return () => clearInterval(id);
  }, [refreshBadge]);

  // Recompute the bell badge each time the dashboard regains focus — e.g. after
  // viewing the notifications screen (which marks items seen) so the dot clears.
  useFocusEffect(useCallback(() => { void refreshBadge(); }, [refreshBadge]));

  function deleteProperty(p: Property) {
    Alert.alert(t('admin.deleteTitle'), p.title, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('admin.delete'), style: 'destructive', onPress: async () => { await adminService.deleteProperty(p.id); void loadProperties(); } },
    ]);
  }

  async function setStatus(inq: Inquiry, status: InquiryStatus) {
    if (inq.status === status) return;
    const previous = inq.status;
    // Optimistic update — show the new status immediately, revert on failure.
    setInquiries((prev) => prev.map((i) => (i.id === inq.id ? { ...i, status } : i)));
    try {
      await adminService.setInquiryStatus(inq.id, status);
    } catch (e) {
      setInquiries((prev) => prev.map((i) => (i.id === inq.id ? { ...i, status: previous } : i)));
      Alert.alert(t('common.error'), e instanceof Error ? e.message : '');
    }
  }

  function deleteInquiry(inq: Inquiry) {
    Alert.alert(t('admin.deleteInquiryTitle'), inq.name, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.delete'),
        style: 'destructive',
        onPress: async () => {
          setInquiries((prev) => prev.filter((i) => i.id !== inq.id));
          try { await adminService.deleteInquiry(inq.id); } catch { void loadInquiries(); }
        },
      },
    ]);
  }

  async function changePlan(u: UserProfile, plan: PlanTier) {
    if ((u.plan ?? 'free') === plan) return;
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, plan } : x)));
    try {
      await adminService.setUserPlan(u.id, plan);
    } catch (e) {
      void loadUsers();
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

  const tones: Record<InquiryStatus, 'warning' | 'info' | 'success' | 'danger'> = { new: 'warning', in_progress: 'info', closed: 'success', deleted: 'danger' };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}>
        <AppText style={{ fontFamily: fonts.serif, fontSize: 22 }}>{t('admin.title')}</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <Pressable onPress={() => router.push('/notifications')} hitSlop={8} style={{ position: 'relative' }}>
            <Ionicons name="notifications-outline" size={20} color={c.textSecondary} />
            {adminNotif > 0 && (
              <View style={{ position: 'absolute', top: -4, right: -5, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: c.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                <AppText style={{ color: '#fff', fontSize: 9, fontFamily: fonts.heading, lineHeight: 11 }}>{adminNotif > 9 ? '9+' : String(adminNotif)}</AppText>
              </View>
            )}
          </Pressable>
          <Pressable onPress={toggleLang} hitSlop={8}>
            <AppText style={{ fontFamily: fonts.semibold, fontSize: 14, color: c.secondary }}>
              {language === 'ar' ? 'EN' : 'ع'}
            </AppText>
          </Pressable>
          <Pressable onPress={() => setPreference(isDark ? 'light' : 'dark')} hitSlop={8}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={c.text} />
          </Pressable>
          <Pressable onPress={confirmSignOut} hitSlop={8}>
            <Ionicons name="log-out-outline" size={20} color={c.danger} />
          </Pressable>
        </View>
      </View>
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
                    <Badge label={t(`propertyType.${item.type}`)} tone="info" />
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <AppText style={{ fontFamily: fonts.semibold, flex: 1 }} numberOfLines={1}>{item.name}</AppText>
                <Badge label={t(`notif.status.${item.status}`)} tone={tones[item.status]} solid />
                <Pressable onPress={() => deleteInquiry(item)} hitSlop={6}><Ionicons name="trash-outline" size={18} color={c.danger} /></Pressable>
              </View>
              <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>{[item.email, item.phone].filter(Boolean).join(' · ')}</AppText>
              {item.message ? (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 }}>
                  <Ionicons name="chatbubble-ellipses-outline" size={15} color={c.textMuted} style={{ marginTop: 2 }} />
                  <AppText color="textSecondary" style={{ flex: 1, lineHeight: 20 }}>{item.message}</AppText>
                </View>
              ) : null}
              <AppText variant="caption" color="textMuted" style={{ marginTop: 8 }}>{t(`notif.kind.${item.kind}`)}</AppText>

              <View style={{ height: 1, backgroundColor: c.border, marginVertical: 12 }} />
              <AppText variant="caption" color="textMuted" style={{ marginBottom: 8 }}>{t('admin.setStatus')}</AppText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {STATUSES.map((s) => {
                  const active = item.status === s;
                  const accent = s === 'new' ? c.tertiary : s === 'in_progress' ? c.info : c.success;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => setStatus(item, s)}
                      style={{
                        flex: 1,
                        height: 40,
                        borderRadius: radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1.5,
                        borderColor: active ? accent : c.border,
                        backgroundColor: active ? accent : 'transparent',
                      }}
                    >
                      <AppText style={{ fontFamily: fonts.semibold, fontSize: 12, color: active ? '#fff' : c.textSecondary }}>
                        {t(`notif.status.${s}`)}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
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
                <Badge label={t(`role.${item.role}`)} tone={item.role === 'admin' ? 'success' : 'neutral'} />
              </View>
              <View style={{ height: 1, backgroundColor: c.border, marginVertical: 10 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <AppText variant="caption" color="textMuted">{t('admin.plan')}</AppText>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(['free', 'pro'] as const).map((pl) => {
                    const active = (item.plan ?? 'free') === pl;
                    return (
                      <Pressable
                        key={pl}
                        onPress={() => changePlan(item, pl)}
                        style={{ paddingHorizontal: 14, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: active ? c.secondary : c.border, backgroundColor: active ? c.secondary : 'transparent' }}
                      >
                        <AppText style={{ fontFamily: fonts.semibold, fontSize: 12, color: active ? '#fff' : c.textSecondary }}>{t(`plan.${pl}`)}</AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Card>
          )}
        />
      )}

      <PropertyFormModal visible={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSaved={loadProperties} />
    </Screen>
  );
}
