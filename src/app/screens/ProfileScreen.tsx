import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { useAuthStore } from '../../store/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { formatDate } from '../../utils/formatters';
import type { RootStackParamList } from '../../navigation/types';

export function ProfileScreen() {
  const { theme, preference, setPreference } = useTheme();
  const c = theme.colors;
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const user     = useAuthStore((s) => s.user);
  const signOut  = useAuthStore((s) => s.signOut);
  const { role, can } = usePermissions();

  const roleTone = role === 'admin' ? 'danger' : role === 'consultant' ? 'warning' : 'success';
  const roleLabel = role === 'admin' ? 'Admin' : role === 'consultant' ? 'Consultant' : 'Investor';

  const themeOptions: {
    key: 'light' | 'dark' | 'system';
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { key: 'light',  label: 'Light',  icon: 'sunny-outline' },
    { key: 'dark',   label: 'Dark',   icon: 'moon-outline' },
    { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  ];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 20, paddingTop: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={{ fontFamily: fonts.serif, fontSize: 21 }}>
          Profile</AppText>

        {/* Account card */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: c.secondaryMuted,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="person" size={26} color={c.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AppText style={{ fontFamily: fonts.heading, fontSize: 18 }}>
                  {user?.fullName ?? 'Investor'}
                </AppText>
                <Badge label={roleLabel} tone={roleTone} />
              </View>
              <AppText variant="caption" color="textMuted">{user?.email}</AppText>
              {user?.createdAt && (
                <AppText variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                  Member since {formatDate(user.createdAt)}
                </AppText>
              )}
            </View>
          </View>
        </Card>

        {/* Appearance */}
        <View>
          <AppText style={{
            fontFamily: fonts.semibold, fontSize: 11,
            letterSpacing: 1, color: c.textMuted, marginBottom: 10,
          }}>
            THEME
          </AppText>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {themeOptions.map((o) => {
              const active = preference === o.key;
              return (
                <Pressable
                  key={o.key}
                  onPress={() => setPreference(o.key)}
                  style={{
                    flex: 1, alignItems: 'center', gap: 6,
                    paddingVertical: 14, borderRadius: radius.md,
                    borderWidth: 1.5,
                    borderColor: active ? c.secondary : c.border,
                    backgroundColor: active ? c.secondaryMuted : c.surface,
                  }}
                >
                  <Ionicons name={o.icon} size={20} color={active ? c.secondary : c.textSecondary} />
                  <AppText style={{
                    fontFamily: fonts.medium, fontSize: 12,
                    color: active ? c.secondary : c.textSecondary,
                  }}>
                    {o.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Admin + about rows */}
        <Card padded>
          <Row
            icon="diamond-outline"
            label="Upgrade Plan"
            onPress={() => nav.navigate('Payment')}
            first
          />
          {can('admin:dashboard') && (
            <Row
              icon="shield-checkmark-outline"
              label="Admin Dashboard"
              onPress={() => nav.navigate('Admin')}
            />
          )}
          <Row
            icon="notifications-outline"
            label="Notifications"
            onPress={() => nav.navigate('Notifications')}
          />
          <Row
            icon="information-circle-outline"
            label="About"
            onPress={() => Alert.alert(
              'PropertyPulse',
              'PropertyPulse v1.0.0\nAI-Powered Real Estate Investment Advisor',
            )}
          />
        </Card>

        {/* Sign out */}
        <Pressable
          onPress={signOut}
          style={{
            flexDirection: 'row', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            paddingVertical: 16, borderRadius: radius.md,
            borderWidth: 1, borderColor: c.border,
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={c.danger} />
          <AppText style={{ fontFamily: fonts.semibold, color: c.danger }}>Sign Out</AppText>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function Row({
  icon, label, onPress, first,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  first?: boolean;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingVertical: 14,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: c.border,
      }}
    >
      <Ionicons name={icon} size={20} color={c.textSecondary} />
      <AppText style={{ flex: 1, fontFamily: fonts.medium, fontSize: 14 }}>{label}</AppText>
      <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
    </Pressable>
  );
}