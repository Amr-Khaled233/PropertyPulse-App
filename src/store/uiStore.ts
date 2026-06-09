
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';
export type Language = 'en' | 'ar';

interface UiState {
  themePreference: ThemePreference;
  language: Language;
  hasHydrated: boolean;
  setThemePreference: (p: ThemePreference) => void;
  setLanguage: (l: Language) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      themePreference: 'system',
      language: 'en',
      hasHydrated: false,
      setThemePreference: (themePreference) => set({ themePreference }),
      setLanguage: (language) => set({ language }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'pp-ui',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ themePreference: s.themePreference, language: s.language }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);