// AI Advisor — RAG chat (POST /chat). Mirrors the web AdvisorPanel.

import { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/common/Screen';
import { AppText } from '../../components/common/Text';
import { Markdown } from '../../components/common/Markdown';
import { AppHeader } from '../../components/common/Brand';
import { Chip } from '../../components/common/Chip';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';
import { useUiStore } from '../../store/uiStore';
import { chatService } from '../../services/api/chatService';
import type { ChatMessage } from '../../types/api';

interface Msg extends ChatMessage {
  sources?: string[];
  pending?: boolean;
}

export default function AdvisorScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { t } = useTranslation();
  const lang = useUiStore((s) => s.language);
  const listRef = useRef<FlatList<Msg>>(null);

  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: t('advisor.greeting') },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  async function send(text: string) {
    const question = text.trim();
    if (!question || sending) return;
    setInput('');
    const history: ChatMessage[] = messages
      .filter((m) => !m.pending)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: 'user', content: question }, { role: 'assistant', content: '', pending: true }]);
    setSending(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const res = await chatService.ask(question, history, lang);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: res.answer, sources: res.sources };
        return next;
      });
    } catch (e) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: e instanceof Error ? e.message : t('common.error') };
        return next;
      });
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  const suggestions = [t('advisor.s1'), t('advisor.s2'), t('advisor.s3')];

  return (
    <Screen edges={['top']}>
      <AppHeader rightIcon="sparkles" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 20, gap: 14 }}
          renderItem={({ item }) => <Bubble msg={item} c={c} />}
          ListHeaderComponent={
            <View style={{ marginBottom: 6 }}>
              <AppText style={{ fontFamily: fonts.serif, fontSize: 24 }}>{t('advisor.title')}</AppText>
              <AppText color="textMuted">{t('advisor.subtitle')}</AppText>
            </View>
          }
        />

        {messages.length <= 1 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingBottom: 10 }}>
            {suggestions.map((s) => (
              <Chip key={s} label={s} onPress={() => send(s)} />
            ))}
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t('advisor.placeholder')}
            placeholderTextColor={c.textMuted}
            multiline
            style={{ flex: 1, maxHeight: 110, minHeight: 44, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, backgroundColor: c.background, paddingHorizontal: 14, paddingTop: 12, color: c.text, fontFamily: fonts.body }}
          />
          <Pressable
            onPress={() => send(input)}
            disabled={sending || !input.trim()}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.secondary, alignItems: 'center', justifyContent: 'center', opacity: sending || !input.trim() ? 0.5 : 1 }}
          >
            <Ionicons name="arrow-up" size={22} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function TypingDots({ color }: { color: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (v: Animated.Value) =>
      Animated.sequence([
        Animated.timing(v, { toValue: -5, duration: 280, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]);
    const loop = Animated.loop(Animated.stagger(120, [bounce(dot1), bounce(dot2), bounce(dot3)]));
    loop.start();
    return () => loop.stop();
  }, [dot1, dot2, dot3]);

  const renderDot = (v: Animated.Value) => (
    <Animated.View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color, transform: [{ translateY: v }] }} />
  );

  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 3, alignItems: 'center', height: 22 }}>
      {renderDot(dot1)}
      {renderDot(dot2)}
      {renderDot(dot3)}
    </View>
  );
}

function Bubble({ msg, c }: { msg: Msg; c: { secondary: string; surface: string; border: string; text: string; textMuted: string; secondaryMuted: string } }) {
  const isUser = msg.role === 'user';
  return (
    <View style={{ alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <View
        style={{
          maxWidth: '86%',
          backgroundColor: isUser ? c.secondary : c.surface,
          borderWidth: isUser ? 0 : 1,
          borderColor: c.border,
          borderRadius: radius.lg,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        {msg.pending ? (
          <TypingDots color={c.textMuted} />
        ) : isUser ? (
          <AppText style={{ color: '#fff', lineHeight: 21 }}>{msg.content}</AppText>
        ) : (
          <Markdown content={msg.content} color={c.text} muted={c.textMuted} />
        )}
        {msg.sources && msg.sources.length > 0 && (
          <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {msg.sources.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.secondaryMuted, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Ionicons name="document-text-outline" size={11} color={c.secondary} />
                <AppText variant="caption" style={{ color: c.secondary }}>{s}</AppText>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
