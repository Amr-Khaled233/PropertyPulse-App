import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { radius, fonts } from '../../theme/theme';
import { AppText } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  password?: boolean;
}

export function Input({ label, error, icon, password, multiline, style, ...rest }: InputProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(password));

  return (
    <View style={{ gap: 6 }}>
      {label && <AppText variant="label" color="textSecondary">{label}</AppText>}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: c.surface,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: error ? c.danger : focused ? c.secondary : c.border,
          paddingHorizontal: 14,
          ...(multiline ? { paddingVertical: 12 } : { height: 52 }),
          gap: 10,
        }}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={c.textMuted}
            style={multiline ? { marginTop: 1 } : undefined}
          />
        )}
        <TextInput
          {...rest}
          multiline={multiline}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={c.textMuted}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[
            {
              flex: 1,
              color: c.text,
              fontFamily: fonts.body,
              fontSize: 15,
              lineHeight: 20,
              // Strip Android's extra top font padding so the first text line
              // sits level with the leading icon in multiline fields.
              includeFontPadding: false,
              ...(multiline ? { minHeight: 72, paddingTop: 0, paddingBottom: 0 } : { height: '100%' }),
            },
            style,
          ]}
        />
        {password && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={c.textMuted} />
          </Pressable>
        )}
      </View>
      {error && <AppText variant="caption" color="danger">{error}</AppText>}
    </View>
  );
}