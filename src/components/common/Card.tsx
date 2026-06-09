import { View, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, shadow } from '../../theme/theme';

export interface CardProps extends ViewProps {
  tone?: 'surface' | 'inverse' | 'alt';
  padded?: boolean;
  elevated?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function Card({ tone = 'surface', padded = true, elevated = true, style, children, ...rest }: CardProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const bg = tone === 'inverse' ? c.primary : tone === 'alt' ? c.surfaceAlt : c.surface;

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius.lg,
          borderWidth: tone === 'inverse' ? 0 : 1,
          borderColor: c.border,
          padding: padded ? 16 : 0,
        },
        elevated && tone !== 'inverse' && shadow.soft,
        style as ViewStyle,
      ]}
    >
      {children}
    </View>
  );
}