import { Pressable, View, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/theme';
import { AppText } from './Text';

export function SectionHeader({
  title,
  onSeeAll,
  accent,
}: {
  title: string;
  onSeeAll?: () => void;
  accent?: boolean;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <AppText
        style={{
          fontFamily: fonts.serif,
          fontSize: 20,
          color: accent ? theme.colors.tertiary : theme.colors.text,
        }}
      >
        {title}
      </AppText>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <AppText variant="label" color="secondary">
            {t('common.seeAll')}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

export function StatTile({
  label,
  value,
  valueColor,
  style,
}: {
  label: string;
  value: string;
  valueColor?: string;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  return (
    <View style={[{ flex: 1 }, style]}>
      <AppText style={{ fontFamily: fonts.medium, fontSize: 10, letterSpacing: 0.6, color: theme.colors.textMuted }}>
        {label}
      </AppText>
      <AppText style={{ fontFamily: fonts.heading, fontSize: 18, color: valueColor ?? theme.colors.text, marginTop: 2 }}>
        {value}
      </AppText>
    </View>
  );
}