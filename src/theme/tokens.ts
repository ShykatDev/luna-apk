/**
 * "Orchid Dusk" palette — mauve / magenta / peach / plum.
 * Every text-on-fill pair below is checked to WCAG AA (≥ 4.5:1):
 *   light  white on plum #4A2D52 11.7 · white on magenta #C2318E 5.1 · white on violet #7A45C9 6.0
 *          ink #2B1A30 on peach #F4A28A 8.0 · secondary #6E5873 on bg 5.9
 *   dark   #1A0F1F on orchid #EBC7F2 12.4 · on pink #F06BBE 6.7 · on lilac #B98CF5 7.2
 *          secondary #A898AE on bg 7.4
 */
export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  glassFallback: string;
  glassBorder: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  separator: string;
  fill: string;
  fillStrong: string;
  /** Main CTA (plum in light, pale orchid in dark) */
  primary: string;
  onPrimary: string;
  /** Selection / today / links */
  accent: string;
  onAccent: string;
  accentSoft: string;
  period: string;
  onPeriod: string;
  periodSoft: string;
  follicular: string;
  fertile: string;
  onFertile: string;
  fertileSoft: string;
  ovulation: string;
  luteal: string;
  /** Readable (AA) text versions of each phase colour, for labels on cards. */
  phaseText: { menstrual: string; follicular: string; ovulation: string; luteal: string };
  danger: string;
  toggleOff: string;
  blobA: string;
  blobB: string;
  blobC: string;
  petal: string;
  shadow: string;
};

export const light: ThemeColors = {
  background: '#FBF6F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F6EDF3',
  glassFallback: 'rgba(255,255,255,0.58)',
  glassBorder: 'rgba(255,255,255,0.95)',
  text: '#2B1A30',
  textSecondary: '#6E5873',
  textTertiary: '#8F7A94',
  separator: 'rgba(43,26,48,0.08)',
  fill: 'rgba(74,45,82,0.06)',
  fillStrong: 'rgba(74,45,82,0.12)',
  primary: '#4A2D52',
  onPrimary: '#FFFFFF',
  accent: '#7A45C9',
  onAccent: '#FFFFFF',
  accentSoft: 'rgba(122,69,201,0.12)',
  period: '#C2318E',
  onPeriod: '#FFFFFF',
  periodSoft: 'rgba(194,49,142,0.16)',
  follicular: '#F7B7D2',
  fertile: '#F4A28A',
  onFertile: '#2B1A30',
  fertileSoft: 'rgba(244,162,138,0.28)',
  ovulation: '#E8734F',
  luteal: '#B98CF5',
  phaseText: { menstrual: '#C2318E', follicular: '#B23E78', ovulation: '#B04A26', luteal: '#7A45C9' },
  danger: '#C62F3B',
  toggleOff: 'rgba(74,45,82,0.14)',
  blobA: '#F3CBE4',
  blobB: '#E2D2FA',
  blobC: '#FCDCCF',
  petal: '#F6D9EA',
  shadow: '#4A2D52',
};

/** Deliberately very dark: near-black with a plum undertone, glows kept subtle. */
export const dark: ThemeColors = {
  background: '#0A070C',
  surface: '#141017',
  surfaceAlt: '#1C1520',
  glassFallback: 'rgba(24,17,28,0.72)',
  glassBorder: 'rgba(255,255,255,0.07)',
  text: '#F5EEF7',
  textSecondary: '#A898AE',
  textTertiary: '#776A7C',
  separator: 'rgba(255,255,255,0.07)',
  fill: 'rgba(255,255,255,0.05)',
  fillStrong: 'rgba(255,255,255,0.10)',
  primary: '#EBC7F2',
  onPrimary: '#1A0F1F',
  accent: '#B98CF5',
  onAccent: '#1A0F1F',
  accentSoft: 'rgba(185,140,245,0.14)',
  period: '#F06BBE',
  onPeriod: '#1A0F1F',
  periodSoft: 'rgba(240,107,190,0.16)',
  follicular: '#8E4E72',
  fertile: '#F4A28A',
  onFertile: '#1A0F1F',
  fertileSoft: 'rgba(244,162,138,0.16)',
  ovulation: '#F0855F',
  luteal: '#9C74D8',
  phaseText: { menstrual: '#F06BBE', follicular: '#D58BB0', ovulation: '#F4A28A', luteal: '#B98CF5' },
  danger: '#FF6B74',
  toggleOff: 'rgba(255,255,255,0.14)',
  blobA: '#3A1131',
  blobB: '#1E1438',
  blobC: '#2C150F',
  petal: '#1B1220',
  shadow: '#000000',
};

export const radius = { sm: 10, md: 18, lg: 26, xl: 34, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

export const font = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

/** Type scale (Poppins runs wide, so sizes sit ~1pt under SF equivalents). */
export const type = {
  display: { fontSize: 44, lineHeight: 50, fontFamily: font.semibold, letterSpacing: -1 },
  largeTitle: { fontSize: 32, lineHeight: 40, fontFamily: font.semibold, letterSpacing: -0.5 },
  title1: { fontSize: 26, lineHeight: 34, fontFamily: font.semibold, letterSpacing: -0.3 },
  title2: { fontSize: 21, lineHeight: 28, fontFamily: font.semibold, letterSpacing: -0.2 },
  title3: { fontSize: 18, lineHeight: 25, fontFamily: font.semibold },
  headline: { fontSize: 16, lineHeight: 22, fontFamily: font.semibold },
  body: { fontSize: 16, lineHeight: 23, fontFamily: font.regular },
  callout: { fontSize: 15, lineHeight: 21, fontFamily: font.regular },
  subhead: { fontSize: 14, lineHeight: 20, fontFamily: font.regular },
  footnote: { fontSize: 13, lineHeight: 18, fontFamily: font.regular },
  caption: { fontSize: 11.5, lineHeight: 15, fontFamily: font.medium },
  overline: { fontSize: 12, lineHeight: 16, fontFamily: font.semibold, letterSpacing: 0.8, textTransform: 'uppercase' as const },
} as const;
