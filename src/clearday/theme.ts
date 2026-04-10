export type ThemeMode = 'light' | 'dark' | 'system';
export type MatrixStyle = 'tinted' | 'editorial' | 'paper';
export type FontChoice = 'cormorant' | 'baskerville' | 'inter' | 'jakarta';

export interface ThemeTokens {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  borderMid: string;
  text: string;
  textMuted: string;
  textGhost: string;
  accent: string;         // steel blue #1B3A5C
  gold: string;           // MIT gold #8A6A14
  goldLight: string;
  q1: string;             // Do Now red
  q2: string;             // Schedule green
  q3: string;             // Delegate blue
  q4: string;             // Eliminate grey
  q1Wash: string;
  q2Wash: string;
  q3Wash: string;
  q4Wash: string;
  overlay: string;
  axisLine: string;
}

export const lightTokens: ThemeTokens = {
  bg: '#F8F7F4',
  surface: '#FFFFFF',
  surface2: '#FEFCF8',
  border: 'rgba(0,0,0,0.07)',
  borderMid: 'rgba(0,0,0,0.12)',
  text: '#1A1814',
  textMuted: '#8B8880',
  textGhost: '#C4BFB8',
  accent: '#1B3A5C',
  gold: '#8A6A14',
  goldLight: '#B8A878',
  q1: '#B83232',
  q2: '#1A6B45',
  q3: '#1A5A8A',
  q4: '#6B6870',
  q1Wash: 'rgba(184,50,50,0.09)',
  q2Wash: 'rgba(26,107,69,0.07)',
  q3Wash: 'rgba(26,90,138,0.065)',
  q4Wash: 'rgba(107,104,112,0.06)',
  overlay: 'rgba(26,24,20,0.32)',
  axisLine: 'rgba(0,0,0,0.08)',
};

export const darkTokens: ThemeTokens = {
  bg: '#0C0E14',
  surface: '#131620',
  surface2: '#1A1D2B',
  border: 'rgba(255,255,255,0.07)',
  borderMid: 'rgba(255,255,255,0.12)',
  text: '#E8EAF0',
  textMuted: '#5A6070',
  textGhost: '#2A3050',
  accent: '#2A6EBB',
  gold: '#C9A84C',
  goldLight: '#8A6A14',
  q1: '#C0392B',
  q2: '#1F6B45',
  q3: '#2471A3',
  q4: '#4A4E5A',
  q1Wash: 'rgba(192,57,43,0.10)',
  q2Wash: 'rgba(31,107,69,0.07)',
  q3Wash: 'rgba(36,113,163,0.07)',
  q4Wash: 'rgba(74,78,90,0.05)',
  overlay: 'rgba(0,0,0,0.46)',
  axisLine: 'rgba(255,255,255,0.07)',
};

export function resolveTheme(mode: ThemeMode, systemScheme: 'light' | 'dark' | null): ThemeTokens {
  if (mode === 'light') return lightTokens;
  if (mode === 'dark') return darkTokens;
  return systemScheme === 'dark' ? darkTokens : lightTokens;
}
