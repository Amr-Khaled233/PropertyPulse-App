
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, fonts } from '../../theme/theme';
import { AppText } from '../common/Text';

export function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View
      style={{
        flex: 1,
        minWidth: '45%',
        backgroundColor: c.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: c.border,
        padding: 14,
      }}
    >
      <AppText style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 0.5, color: c.textMuted }}>
        {label}
      </AppText>
      <AppText style={{ fontFamily: fonts.heading, fontSize: 22, color: accent ?? c.text, marginTop: 4 }}>
        {value}
      </AppText>
    </View>
  );
}