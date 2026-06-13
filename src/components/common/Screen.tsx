import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';

export interface ScreenProps {
  children: ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  padded?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, edges = ['top'], padded = false, style }: ScreenProps) {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[
        {
          flex: 1,
          backgroundColor: theme.colors.background,
          paddingHorizontal: padded ? 20 : 0,
        },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}
