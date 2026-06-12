// Minimal, dependency-free Markdown renderer for the AI advisor answers.
// Handles the subset Gemini actually emits: #/##/### headings, **bold**,
// "-"/"*" bullets and "1." numbered lists. Everything else renders as text.

import { Fragment } from 'react';
import { View } from 'react-native';
import { fonts } from '../../theme/theme';
import { AppText } from './Text';

/** Split a line into plain / **bold** segments (nested <Text> stays inline). */
function renderInline(text: string, color: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p.length > 0);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <AppText key={i} style={{ fontFamily: fonts.semibold, color }}>
          {p.slice(2, -2)}
        </AppText>
      );
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}

export function Markdown({ content, color, muted }: { content: string; color: string; muted: string }) {
  const lines = content.replace(/\r/g, '').split('\n');

  return (
    <View style={{ gap: 6 }}>
      {lines.map((raw, i) => {
        const line = raw.trim();
        if (!line) return null; // blank line — the container gap handles spacing

        const heading = line.match(/^(#{1,3})\s+(.*)$/);
        if (heading) {
          const size = heading[1].length === 1 ? 18 : heading[1].length === 2 ? 16 : 15;
          return (
            <AppText key={i} style={{ fontFamily: fonts.semibold, fontSize: size, color, marginTop: i ? 4 : 0 }}>
              {renderInline(heading[2], color)}
            </AppText>
          );
        }

        const bullet = line.match(/^[-*]\s+(.*)$/);
        if (bullet) {
          return (
            <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
              <AppText style={{ color: muted, lineHeight: 21 }}>•</AppText>
              <AppText style={{ flex: 1, color, lineHeight: 21 }}>{renderInline(bullet[1], color)}</AppText>
            </View>
          );
        }

        const numbered = line.match(/^(\d+)\.\s+(.*)$/);
        if (numbered) {
          return (
            <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
              <AppText style={{ color: muted, fontFamily: fonts.semibold, lineHeight: 21 }}>{numbered[1]}.</AppText>
              <AppText style={{ flex: 1, color, lineHeight: 21 }}>{renderInline(numbered[2], color)}</AppText>
            </View>
          );
        }

        return (
          <AppText key={i} style={{ color, lineHeight: 21 }}>
            {renderInline(line, color)}
          </AppText>
        );
      })}
    </View>
  );
}
