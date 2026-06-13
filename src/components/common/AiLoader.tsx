// Animated loading indicator for AI operations.
// Shows a pulsing sparkles icon on a glowing disc + bouncing dots + optional text.

import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './Text';
import { fonts } from '../../theme/theme';

interface AiLoaderProps {
  title: string;
  body?: string;
  /** Reduces vertical padding for use inside a tab/card rather than full screen. */
  compact?: boolean;
}

export function AiLoader({ title, body, compact = false }: AiLoaderProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(1)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.16, duration: 900, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.0, duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glow, { toValue: 0.5, duration: 900, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 1.0, duration: 900, useNativeDriver: true }),
        ]),
      ]),
    );

    const bounce = (v: Animated.Value) =>
      Animated.sequence([
        Animated.timing(v, { toValue: -5, duration: 280, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]);
    const dots = Animated.loop(Animated.stagger(120, [bounce(dot1), bounce(dot2), bounce(dot3)]));

    pulse.start();
    dots.start();
    return () => {
      pulse.stop();
      dots.stop();
    };
  }, [scale, glow, dot1, dot2, dot3]);

  const dot = (v: Animated.Value) => (
    <Animated.View
      style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.textMuted, transform: [{ translateY: v }] }}
    />
  );

  return (
    <View style={{ alignItems: 'center', paddingVertical: compact ? 32 : 56, gap: 14 }}>
      <Animated.View style={{ transform: [{ scale }], opacity: glow }}>
        <View
          style={{
            width: compact ? 60 : 72,
            height: compact ? 60 : 72,
            borderRadius: compact ? 30 : 36,
            backgroundColor: c.secondaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="sparkles" size={compact ? 28 : 34} color={c.secondary} />
        </View>
      </Animated.View>

      <AppText style={{ fontFamily: fonts.serif, fontSize: compact ? 16 : 18 }} center>{title}</AppText>
      {body && <AppText color="textMuted" center style={{ marginTop: -4 }}>{body}</AppText>}

      <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 4 }}>
        {dot(dot1)}
        {dot(dot2)}
        {dot(dot3)}
      </View>
    </View>
  );
}
