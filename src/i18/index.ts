import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';
import { en } from './locals/en';
import { ar } from './locals/ar';
import { useUiStore, type Language } from '../store/uiStore';

const deviceLang = getLocales()[0]?.languageCode === 'ar' ? 'ar' : 'en';
const initialLang: Language = useUiStore.getState().language ?? deviceLang;

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** Whether the given language is right-to-left. */
export function isRTL(lang: Language): boolean {
  return lang === 'ar';
}

/**
 * Apply a language at runtime. Toggling RTL requires a reload to fully restyle
 * native layout; callers should prompt the user to restart when rtlChanged.
 */
export async function applyLanguage(lang: Language): Promise<{ rtlChanged: boolean }> {
  await i18n.changeLanguage(lang);
  const rtl = isRTL(lang);
  const rtlChanged = I18nManager.isRTL !== rtl;
  if (rtlChanged) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
  }
  return { rtlChanged };
}

export { i18n };