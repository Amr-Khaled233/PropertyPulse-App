import { Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { AppText } from './Text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, selected, onPress }: ChipProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.pill,
        backgroundColor: selected ? c.secondary : c.surfaceAlt,
        borderWidth: 1,
        borderColor: selected ? c.secondary : c.border,
      }}
    >
      <AppText style={{ fontFamily: fonts.medium, fontSize: 13, color: selected ? '#fff' : c.textSecondary }}>
        {label}
      </AppText>
    </Pressable>
  );
}
