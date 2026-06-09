import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable,
  ScrollView, TextInput, View, Text, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, radius } from '../../theme/theme';

// ── Types ────────────────────────────────────────────────────────
type Role = 'user' | 'assistant';
interface ChatMessage { role: Role; content: string; }

// ── Suggestions ──────────────────────────────────────────────────
const SUGGESTIONS = [
  'Best areas to invest in Cairo?',
  'How to calculate rental yield?',
  'Off-plan vs ready property risks?',
  'North Coast investment outlook?',
  'How to diversify my portfolio?',
];

// ── API call ─────────────────────────────────────────────────────
async function askAI(question: string, history: ChatMessage[]): Promise<string> {
  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are PropertyPulse AI, an expert real estate investment advisor 
               specializing in the Egyptian property market. You provide concise, 
               actionable investment advice. Focus on Cairo, Giza, New Cairo, 
               North Coast, and Red Sea markets. Always respond in English.`,
      messages,
    }),
  });

  const data = await res.json();
  return data?.content?.[0]?.text ?? 'Sorry, I could not get a response. Please try again.';
}

// ── Screen ───────────────────────────────────────────────────────
export function ChatScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your PropertyPulse AI advisor. Ask me anything about Egyptian real estate investment — market trends, ROI calculations, area comparisons, and more.",
    },
  ]);
  const [input, setInput]   = useState('');
  const [typing, setTyping] = useState(false);

  const scrollToEnd = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || typing) return;

    const updated: ChatMessage[] = [...messages, { role: 'user', content: question }];
    setMessages(updated);
    setInput('');
    setTyping(true);
    scrollToEnd();

    try {
      const answer = await askAI(question, messages);
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setTyping(false);
      scrollToEnd();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}>

      {/* ── Header ───────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View style={[styles.avatarWrap, { backgroundColor: c.secondaryMuted }]}>
          <Ionicons name="sparkles" size={20} color={c.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: c.text, fontFamily: fonts.serif }]}>
            PropertyPulse AI
          </Text>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: c.success }]} />
            <Text style={[styles.onlineText, { color: c.textMuted, fontFamily: fonts.medium }]}>
              Online · Egyptian Market Specialist
            </Text>
          </View>
        </View>
        <View style={[styles.modelBadge, { backgroundColor: c.secondaryMuted }]}>
          <Text style={[styles.modelText, { color: c.secondary }]}>claude</Text>
        </View>
      </View>

      {/* ── Messages + Input ─────────────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 60}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.dateLabel, { color: c.textMuted, fontFamily: fonts.medium }]}>
            Today
          </Text>

          {messages.map((m, i) => (
            <Bubble key={i} message={m} colors={c} />
          ))}

          {typing && (
            <View style={styles.typingRow}>
              <View style={[styles.typingBubble, { backgroundColor: c.surface, borderColor: c.border }]}>
                <ActivityIndicator size="small" color={c.secondary} />
                <Text style={[styles.typingText, { color: c.textMuted, fontFamily: fonts.medium }]}>
                  Analyzing...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggestions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsRow}
        >
          {SUGGESTIONS.map(s => (
            <Pressable
              key={s}
              onPress={() => send(s)}
              style={({ pressed }) => [
                styles.suggestionChip,
                { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[styles.suggestionText, { color: c.textSecondary, fontFamily: fonts.medium }]}>
                {s}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Composer */}
        <View style={[
          styles.composer,
          {
            borderTopColor: c.border,
            backgroundColor: c.surface,
            paddingBottom: insets.bottom + 10,
          },
        ]}>
          <View style={[styles.inputWrap, { backgroundColor: c.surfaceAlt }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about Egyptian real estate..."
              placeholderTextColor={c.textMuted}
              style={[styles.input, { color: c.text, fontFamily: fonts.body }]}
              onSubmitEditing={() => send(input)}
              returnKeyType="send"
              multiline
              maxLength={500}
            />
          </View>
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim() || typing}
            style={({ pressed }) => [
              styles.sendButton,
              { backgroundColor: input.trim() && !typing ? c.secondary : c.surfaceAlt },
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={input.trim() && !typing ? '#fff' : c.textMuted}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Bubble ───────────────────────────────────────────────────────
function Bubble({ message, colors: c }: { message: ChatMessage; colors: any }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && (
        <View style={[styles.aiBubbleAvatar, { backgroundColor: c.secondaryMuted }]}>
          <Ionicons name="sparkles" size={14} color={c.secondary} />
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser
          ? { backgroundColor: c.primary, borderBottomRightRadius: 4 }
          : { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderBottomLeftRadius: 4 },
      ]}>
        <Text style={[
          styles.bubbleText,
          { color: isUser ? c.textOnPrimary : c.text },
        ]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  avatarWrap: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18 },
  onlineRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot:   { width: 7, height: 7, borderRadius: 4 },
  onlineText:  { fontSize: 11 },
  modelBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  modelText:   { fontSize: 11, fontWeight: '700' },

  // Messages
  messageList: { padding: 20, gap: 14, paddingBottom: 8 },
  dateLabel:   { fontSize: 11, textAlign: 'center', marginBottom: 4 },

  // Typing
  typingRow:    { flexDirection: 'row', alignItems: 'center' },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  typingText: { fontSize: 13 },

  // Suggestions
  suggestionsRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 10, paddingTop: 4 },
  suggestionChip: {
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  suggestionText: { fontSize: 12 },

  // Composer
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1,
  },
  inputWrap: {
    flex: 1, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    minHeight: 46, justifyContent: 'center',
  },
  input: { fontSize: 14, maxHeight: 100 },
  sendButton: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },

  // Bubbles
  bubbleRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleRowUser: { flexDirection: 'row-reverse' },
  aiBubbleAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '82%', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  bubbleText: { fontSize: 14, lineHeight: 21 },
});