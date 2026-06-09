export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Brand
  primary: string;
  primaryMuted: string;
  secondary: string;
  secondaryMuted: string;
  tertiary: string;
  tertiaryMuted: string;
  info: string;
  // Surfaces
  background: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  inverse: string; // dark feature cards on light bg / vice-versa

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  textOnInverse: string;

  // Lines / states
  border: string;
  borderStrong: string;
  success: string;
  warning: string;
  danger: string;
  star: string;
  overlay: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

const brand = {
  primary: '#0A1628',
  secondary: '#0B9972',
  tertiary: '#D4850A',
  neutral: '#F8F7F4',
};

export const lightColors: ThemeColors = {
  primary: brand.primary,
  primaryMuted: '#1C2B45',
  secondary: brand.secondary,
  secondaryMuted: '#E3F4EE',
  tertiary: brand.tertiary,
  tertiaryMuted: '#FBEFD9',

  background: brand.neutral,
  surface: '#FFFFFF',
  surfaceAlt: '#F1EFEA',
  card: '#FFFFFF',
  inverse: brand.primary,

  text: '#0A1628',
  textSecondary: '#3D4A5C',
  textMuted: '#8A93A0',
  textOnPrimary: '#FFFFFF',
  textOnInverse: '#F8F7F4',

  border: '#E7E4DD',
  borderStrong: '#D6D2C8',
  success: '#0B9972',
  warning: '#D4850A',
  danger: '#C0392B',
  info: '#185FA5',
  star: '#E0A92E',
  overlay: 'rgba(10,22,40,0.55)',
};

export const darkColors: ThemeColors = {
  primary: '#0B9972', // emerald becomes the lead accent in dark
  primaryMuted: '#10B981',
  secondary: '#0B9972',
  secondaryMuted: '#10322A',
  tertiary: '#E59B2A',
  tertiaryMuted: '#3A2C12',

  background: '#070D17',
  surface: '#0E1828',
  surfaceAlt: '#142133',
  card: '#0E1828',
  inverse: '#0B9972',

  text: '#F3F5F8',
  textSecondary: '#AEB7C4',
  textMuted: '#6B7686',
  textOnPrimary: '#04130E',
  textOnInverse: '#F8F7F4',

  border: '#1E2C40',
  borderStrong: '#2A3B53',
  success: '#19B587',
  warning: '#E59B2A',
  danger: '#E5635A',
  star: '#E0A92E',
  info: '#185FA5',
  overlay: 'rgba(0,0,0,0.6)',
};

export const themes: Record<ThemeMode, Theme> = {
  light: { mode: 'light', colors: lightColors },
  dark: { mode: 'dark', colors: darkColors },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const fonts = {
  // Newsreader = editorial serif headlines; DM Sans = UI body/labels.
  // DM Sans ships 400/500/700 here, so semibold maps to the bold weight.
  serif: 'Newsreader_600SemiBold',
  serifRegular: 'Newsreader_400Regular',
  heading: 'DMSans_700Bold',
  semibold: 'DMSans_700Bold',
  medium: 'DMSans_500Medium',
  body: 'DMSans_400Regular',
} as const;

export const typography = {
  display: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 40 },
  h1: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 32 },
  h2: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 28 },
  title: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24 },
  subtitle: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 15 },
} as const;

export const shadow = {
  card: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  soft: {
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;