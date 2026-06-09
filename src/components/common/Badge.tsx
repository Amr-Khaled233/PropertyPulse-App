import { View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, fonts } from '../../theme/theme';
import { AppText } from './Text';

export type BadgeTone = 'success' | 'warning' | 'info' | 'neutral' | 'danger';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
  solid?: boolean;
  style?: ViewStyle;
}

export function Badge({ label, tone = 'neutral', icon, solid, style }: BadgeProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const map: Record<BadgeTone, string> = {
    success: c.success,
    warning: c.tertiary,
    info: c.primary,
    neutral: c.textMuted,
    danger: c.danger,
  };
  const accent = map[tone];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          alignSelf: 'flex-start',
          backgroundColor: solid ? accent : `${accent}22`,
          borderRadius: radius.pill,
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={12} color={solid ? '#fff' : accent} />}
      <AppText style={{ color: solid ? '#fff' : accent, fontFamily: fonts.semibold, fontSize: 11 }}>
        {label}
      </AppText>
    </View>
  );
}