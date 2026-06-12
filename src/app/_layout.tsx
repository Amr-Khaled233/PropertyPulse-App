import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Newsreader_400Regular, Newsreader_600SemiBold } from '@expo-google-fonts/newsreader';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { i18n, applyLanguage } from '../i18';

// Public routes reachable without authentication.
const PUBLIC = new Set(['index', 'login', 'register']);

function useAuthGate() {
  const status = useAuthStore((s) => s.status);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const root = segments[0] ?? 'index';
    const isPublic = PUBLIC.has(root);
    if (status === 'unauthenticated' && !isPublic) router.replace('/login');
    else if (status === 'authenticated' && (root === 'login' || root === 'register')) router.replace('/home');
  }, [status, segments, router]);
}

function useLanguageSync() {
  const language = useUiStore((s) => s.language);
  useEffect(() => {
    if (i18n.language !== language) void applyLanguage(language);
  }, [language]);
}

function Navigation() {
  const { theme, isDark } = useTheme();
  useAuthGate();
  useLanguageSync();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }} />
    </>
  );
}

export default function RootLayout() {
  const init = useAuthStore((s) => s.init);
  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    void init();
  }, [init]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#F8F7F4' }} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Navigation />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
