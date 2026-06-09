import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ROLE_ORDER, type UserProfile, type UserRole } from '@propertypulse/shared-types';
import { Screen } from '../../components/common/Screen';
import { ScreenHeader } from '../../components/common/Brand';
import { AppText } from '../../components/common/Text';
import { InlineLoader } from '../../components/common/Loader';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuthStore } from '../../store/authStore';
import { adminService } from '../../services/api/adminService';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminUsers'>;

// Short labels to prevent wrapping in pill buttons
const ROLE_SHORT_LABELS: Record<UserRole, string> = {
  admin:      'Admin',
  consultant: 'Consult',
  broker:     'Broker',
  agent:      'Agent',
  investor:   'Investor',
};

export function AdminUsersScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const c = theme.colors;
  const me = useAuthStore((s) => s.user);

  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const debounced = useDebounce(query);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    adminService
      .listUsers(debounced || undefined)
      .then((list) => alive && setUsers(list))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [debounced]);

  async function changeRole(user: UserProfile, role: UserRole) {
    if (role === user.role) return;
    if (user.id === me?.id) {
      Alert.alert(t('admin.manageUsers'), t('admin.cannotSelf'));
      return;
    }
    setSavingId(user.id);
    try {
      const updated = await adminService.setUserRole(user.id, role);
      if (updated) {
        setUsers((xs) => xs.map((u) => (u.id === user.id ? { ...u, role } : u)));
        Alert.alert(
          t('admin.manageUsers'),
          t('admin.roleUpdated', { name: user.fullName ?? user.email, role: t(`admin.roles.${role}`) }),
        );
      }
    } catch {
      Alert.alert(t('admin.manageUsers'), t('admin.roleError'));
    } finally {
      setSavingId(null);
    }
  }

  // Full color coverage for all 5 roles
  const roleTone = (role: UserRole): string => {
    switch (role) {
      case 'admin':      return c.danger;
      case 'consultant': return c.tertiary;
      case 'broker':     return c.info ?? '#185FA5';
      case 'agent':      return c.secondary;
      case 'investor':   return c.success ?? '#0F6E56';
      default:           return c.textMuted;
    }
  };

  return (
    <Screen>
      <ScreenHeader title={t('admin.manageUsers')} onBack={() => navigation.goBack()} />

      {/* Search */}
      <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: c.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: c.border,
          paddingHorizontal: 14,
          height: 46,
        }}>
          <Ionicons name="search" size={18} color={c.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('admin.searchUsers')}
            placeholderTextColor={c.textMuted}
            autoCapitalize="none"
            style={{ flex: 1, color: c.text, fontFamily: fonts.body, fontSize: 14 }}
          />
        </View>
      </View>

      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading
            ? <InlineLoader />
            : <AppText color="textMuted" center style={{ marginTop: 24 }}>No users found</AppText>
        }
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: c.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: c.border,
            padding: 14,
            gap: 10,
          }}>
            {/* User info row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 42, height: 42, borderRadius: 21,
                backgroundColor: `${roleTone(item.role)}22`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <AppText style={{ fontFamily: fonts.heading, fontSize: 16, color: roleTone(item.role) }}>
                  {(item.fullName ?? item.email).charAt(0).toUpperCase()}
                </AppText>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText
                  numberOfLines={1}
                  style={{ fontFamily: fonts.semibold, fontSize: 14 }}
                >
                  {item.fullName ?? item.email}
                  {item.id === me?.id ? ' (you)' : ''}
                </AppText>
                <AppText numberOfLines={1} variant="caption" color="textMuted">
                  {item.email}
                </AppText>
              </View>
              {savingId === item.id && (
                <Ionicons name="sync" size={16} color={c.textMuted} />
              )}
            </View>

            {/* Role selector — short labels, smaller padding to prevent wrapping */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {ROLE_ORDER.map((role) => {
                const active = item.role === role;
                const tone = roleTone(role);
                return (
                  <Pressable
                    key={role}
                    onPress={() => changeRole(item, role)}
                    disabled={savingId === item.id}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: 6,
                      paddingHorizontal: 2,
                      borderRadius: radius.pill,
                      borderWidth: 1.5,
                      borderColor: active ? tone : c.border,
                      backgroundColor: active ? `${tone}18` : 'transparent',
                      opacity: savingId === item.id ? 0.5 : 1,
                    }}
                  >
                    <AppText style={{
                      fontFamily: fonts.medium,
                      fontSize: 11,
                      color: active ? tone : c.textSecondary,
                    }}>
                      {ROLE_SHORT_LABELS[role]}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      />
    </Screen>
  );
}