// Numbered pagination with prev/next and a jump-to-page input — sized for phones.

import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radius } from '../theme/theme';
import { AppText } from './common/Text';

interface Props {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

/** Compact page window around the current page (e.g. 1 … 4 5 6 … 20). */
function pageWindow(page: number, pageCount: number): (number | '…')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) out.push('…');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < pageCount - 1) out.push('…');
  out.push(pageCount);
  return out;
}

export function Pagination({ page, pageCount, onChange }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [jump, setJump] = useState('');
  if (pageCount <= 1) return null;

  const go = (p: number) => onChange(Math.min(Math.max(1, p), pageCount));

  return (
    <View style={{ gap: 12, marginTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6 }}>
        <PageBtn disabled={page <= 1} onPress={() => go(page - 1)} icon="chevron-back" c={c} />
        {pageWindow(page, pageCount).map((p, i) =>
          p === '…' ? (
            <AppText key={`e${i}`} color="textMuted" style={{ paddingHorizontal: 2 }}>…</AppText>
          ) : (
            <Pressable
              key={p}
              onPress={() => go(p)}
              style={{
                minWidth: 36,
                height: 36,
                paddingHorizontal: 8,
                borderRadius: radius.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: p === page ? c.primary : c.surface,
                borderWidth: 1,
                borderColor: p === page ? c.primary : c.border,
              }}
            >
              <AppText style={{ fontFamily: fonts.semibold, color: p === page ? c.textOnPrimary : c.text }}>{p}</AppText>
            </Pressable>
          ),
        )}
        <PageBtn disabled={page >= pageCount} onPress={() => go(page + 1)} icon="chevron-forward" c={c} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <AppText variant="caption" color="textMuted">Go to</AppText>
        <TextInput
          value={jump}
          onChangeText={setJump}
          keyboardType="number-pad"
          placeholder={`${page}`}
          placeholderTextColor={c.textMuted}
          style={{
            width: 56,
            height: 36,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: c.surface,
            textAlign: 'center',
            color: c.text,
            fontFamily: fonts.body,
          }}
        />
        <Pressable
          onPress={() => {
            const n = Number(jump);
            if (Number.isFinite(n) && n >= 1) go(n);
            setJump('');
          }}
          style={{ height: 36, paddingHorizontal: 14, borderRadius: radius.sm, backgroundColor: c.secondary, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppText style={{ fontFamily: fonts.semibold, color: '#fff' }}>Go</AppText>
        </Pressable>
        <AppText variant="caption" color="textMuted">of {pageCount}</AppText>
      </View>
    </View>
  );
}

function PageBtn({ disabled, onPress, icon, c }: { disabled: boolean; onPress: () => void; icon: 'chevron-back' | 'chevron-forward'; c: { surface: string; border: string; textMuted: string; text: string } }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{ width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, opacity: disabled ? 0.4 : 1 }}
    >
      <Ionicons name={icon} size={18} color={c.text} />
    </Pressable>
  );
}
