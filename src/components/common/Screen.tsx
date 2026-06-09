import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';

export interface ScreenProps {
  children: ReactNode;
  edges?: ('top' | 'bottom')[];
  padded?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, edges = ['top'], padded = false, style }: ScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  console.log('insets.top:', insets.top)

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: theme.colors.background,
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
          paddingHorizontal: padded ? 20 : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}