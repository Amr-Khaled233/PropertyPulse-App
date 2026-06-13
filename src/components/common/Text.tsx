import { Text as RNText, StyleSheet, type TextProps as RNTextProps, type TextStyle } from 'react-native';
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

  const flat = StyleSheet.flatten([
    typography[variant],
    { color: theme.colors[color] },
    center && { textAlign: 'center' as const },
    style,
  ]) as TextStyle;

  // When an inline style overrides fontFamily/fontSize but not lineHeight, the
  // base typography lineHeight (e.g. 21 from `body`) stays, producing a line box
  // smaller than the font — the top/bottom of glyphs get clipped. Fix whenever
  // the current lineHeight is insufficient for the current fontSize.
  if (
    typeof flat.fontSize === 'number' &&
    (flat.lineHeight == null || (typeof flat.lineHeight === 'number' && flat.lineHeight < flat.fontSize * 1.2))
  ) {
    const isSerif = typeof flat.fontFamily === 'string' && flat.fontFamily.includes('Newsreader');
    flat.lineHeight = Math.round(flat.fontSize * (isSerif ? 1.32 : 1.2));
  }

  return <RNText {...rest} style={flat} />;
}