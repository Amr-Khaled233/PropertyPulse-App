import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/theme';
import { AppText } from './Text';

export function BrandMark({ size = 22 }: { size?: number }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name="pulse" size={size} color={theme.colors.secondary} />
      <AppText style={{ fontFamily: fonts.serif, fontSize: size * 0.85, color: theme.colors.text }}>
        PropertyPulse
      </AppText>
    </View>
  );
}

/** Simple back + title header for stack (detail-style) screens. */
export function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
      <Pressable onPress={onBack} hitSlop={8}>
        <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
      </Pressable>
      <AppText style={{ fontFamily: fonts.serif, fontSize: 22, color: theme.colors.text }}>{title}</AppText>
    </View>
  );
}

export interface AppHeaderProps {
  onBell?: () => void;
  onProfile?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  bellCount?: number;
}

export function AppHeader({ onBell, onProfile, rightIcon = 'information-circle-outline', bellCount = 0 }: AppHeaderProps) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
      }}
    >
      <BrandMark />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Pressable onPress={onBell} hitSlop={8} style={{ position: 'relative' }}>
          <Ionicons name="notifications-outline" size={22} color={theme.colors.textSecondary} />
          {bellCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -5,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: theme.colors.danger,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 3,
              }}
            >
              <AppText style={{ color: '#fff', fontSize: 9, fontFamily: fonts.heading, lineHeight: 11 }}>
                {bellCount > 9 ? '9+' : String(bellCount)}
              </AppText>
            </View>
          )}
        </Pressable>
        <Pressable onPress={onProfile} hitSlop={8}>
          <Ionicons name={rightIcon} size={22} color={theme.colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}