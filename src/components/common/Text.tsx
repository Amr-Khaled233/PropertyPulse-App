import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/theme';

type Variant = keyof typeof typography;
type ColorKey = 'text' | 'textSecondary' | 'textMuted' | 'textOnPrimary' | 'textOnInverse' | 'secondary' | 'tertiary' | 'primary' | 'danger' | 'success';

export interface AppTextProps extends RNTextProps {
  variant?: Variant;
  color?: ColorKey;
  center?: boolean;
  style?: TextStyle | TextStyle[];
}

export function AppText({ variant = 'body', color = 'text', center, style, ...rest }: AppTextProps) {
  const { theme } = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        { color: theme.colors[color] },
        center && { textAlign: 'center' },
        style as TextStyle,
      ]}
    />
  );
}