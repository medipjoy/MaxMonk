import { ColorSchemeName } from 'react-native';
import { ThemeMode } from './types';

export interface ThemeTokens {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  overlay: string;
  axis: string;
  axisSoft: string;
}

const darkTokens: ThemeTokens = {
  bg: '#07070D',
  surface: '#0F0F16',
  surface2: '#14141C',
  border: 'rgba(255,255,255,0.08)',
  text: '#DDDDE8',
  muted: '#76768F',
  accent: '#A78BFA',
  overlay: 'rgba(0,0,0,0.46)',
  axis: 'rgba(221,221,232,0.28)',
  axisSoft: 'rgba(221,221,232,0.06)',
};

const lightTokens: ThemeTokens = {
  bg: '#F3F5F9',
  surface: '#FFFFFF',
  surface2: '#F7F8FC',
  border: 'rgba(27,29,39,0.12)',
  text: '#1B1D27',
  muted: '#70778A',
  accent: '#7356E8',
  overlay: 'rgba(9,12,22,0.26)',
  axis: 'rgba(27,29,39,0.26)',
  axisSoft: 'rgba(27,29,39,0.07)',
};

export function resolveTheme(mode: ThemeMode, systemScheme: ColorSchemeName): ThemeTokens {
  if (mode === 'light') return lightTokens;
  if (mode === 'dark') return darkTokens;
  return systemScheme === 'light' ? lightTokens : darkTokens;
}

