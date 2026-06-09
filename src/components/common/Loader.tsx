import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './Text';

export function Loader({ label }: { label?: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: theme.colors.background }}>
      <ActivityIndicator size="large" color={theme.colors.secondary} />
      {label && <AppText variant="label" color="textMuted">{label}</AppText>}
    </View>
  );
}

export function InlineLoader() {
  const { theme } = useTheme();
  return (
    <View style={{ paddingVertical: 32, alignItems: 'center' }}>
      <ActivityIndicator color={theme.colors.secondary} />
    </View>
  );
}