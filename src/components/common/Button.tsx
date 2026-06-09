import { ActivityIndicator, Pressable, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, fonts } from '../../theme/theme';
import { AppText } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'inverted' | 'outlined' | 'google';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading,
  disabled,
  icon,
  fullWidth = true,
  style,
}: ButtonProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const palette: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: c.primary, fg: c.textOnPrimary },
    secondary: { bg: c.surfaceAlt, fg: c.text },
    inverted: { bg: c.inverse, fg: c.textOnInverse },
    outlined: { bg: 'transparent', fg: c.text, border: c.borderStrong },
    google: { bg: c.surface, fg: c.text, border: c.border },
  };
  const p = palette[variant];
  const height = size === 'lg' ? 54 : 46;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height,
          borderRadius: radius.md,
          backgroundColor: p.bg,
          borderWidth: p.border ? 1 : 0,
          borderColor: p.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          paddingHorizontal: 20,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <>
          {variant === 'google' && <GoogleGlyph />}
          {icon && variant !== 'google' && <Ionicons name={icon} size={18} color={p.fg} />}
          <AppText style={{ color: p.fg, fontFamily: fonts.semibold, fontSize: 15 }}>{label}</AppText>
        </>
      )}
    </Pressable>
  );
}

// Minimal multi-color "G" mark drawn with overlapping text isn't reliable, so
// we use the Google brand glyph from Ionicons' logo set.
function GoogleGlyph() {
  return (
    <View>
      <Ionicons name="logo-google" size={18} color="#EA4335" />
    </View>
  );
}