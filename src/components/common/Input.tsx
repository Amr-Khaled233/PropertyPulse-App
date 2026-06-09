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

export function Input({ label, error, icon, password, style, ...rest }: InputProps) {
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
          alignItems: 'center',
          backgroundColor: c.surface,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: error ? c.danger : focused ? c.secondary : c.border,
          paddingHorizontal: 14,
          height: 52,
          gap: 10,
        }}
      >
        {icon && <Ionicons name={icon} size={18} color={c.textMuted} />}
        <TextInput
          {...rest}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={c.textMuted}
          style={[{ flex: 1, color: c.text, fontFamily: fonts.body, fontSize: 15, height: '100%' }, style]}
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