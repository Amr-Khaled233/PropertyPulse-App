import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { themes, spacing, radius, fonts, typography, shadow, type Theme, type ThemeMode } from './theme';
import { useUiStore } from '../store/uiStore';

export interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  preference: 'light' | 'dark' | 'system';
  isDark: boolean;
  setPreference: (p: 'light' | 'dark' | 'system') => void;
  toggle: () => void;
  spacing: typeof spacing;
  radius: typeof radius;
  fonts: typeof fonts;
  typography: typeof typography;
  shadow: typeof shadow;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme() ?? 'light';
  const preference = useUiStore((s) => s.themePreference);
  const setThemePreference = useUiStore((s) => s.setThemePreference);

  const mode: ThemeMode = preference === 'system' ? (system as ThemeMode) : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themes[mode],
      mode,
      preference,
      isDark: mode === 'dark',
      setPreference: setThemePreference,
      toggle: () => setThemePreference(mode === 'dark' ? 'light' : 'dark'),
      spacing,
      radius,
      fonts,
      typography,
      shadow,
    }),
    [mode, preference, setThemePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}