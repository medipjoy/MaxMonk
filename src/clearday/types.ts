export type Quadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type AgendaDomain = string;
export type AgendaTime = 'quick' | 'short' | 'medium' | 'deep';
export type AgendaStatus = 'active' | 'onhold' | 'deleted' | 'done';
export type ThemeMode = 'system' | 'light' | 'dark';
export type MatrixStyle = 'tinted' | 'editorial' | 'paper';
export type FontChoice = 'cormorant' | 'baskerville' | 'inter' | 'jakarta';
export type ExpiryDefault = 'off' | 'on_60d';
export const DEFAULT_TAGS = ['Professional', 'Personal'] as const;
export const TAG_MAX_LENGTH = 12;
export const AGENDA_TITLE_MAX_LENGTH = 80;
export const QUADRANT_LABEL_MAX_LENGTH = 12;
export const DEFAULT_QUADRANT_LABELS: Record<Quadrant, string> = {
  Q1: 'Do Now',
  Q2: 'Schedule',
  Q3: 'Delegate',
  Q4: 'Eliminate',
};

export interface Agenda {
  id: string;
  text: string;
  quadrant: Quadrant;
  domain: AgendaDomain;
  time: AgendaTime;
  status: AgendaStatus;
  cx: number;
  cy: number;
  createdAt: number;
  doneAt?: number;
  onHoldAt?: number;
}

export interface VaultEntry extends Agenda {
  archivedAt: number;
}

export interface Spark {
  id: string;
  text: string;
  createdAt: number;
}

export interface AppConfig {
  name: string;
  migratedV1: boolean;
  themeMode: ThemeMode;
  vaultExpiryDefault: ExpiryDefault;
  holdExpiryDefault: ExpiryDefault;
  tags: string[];
  quadrantLabels: Record<Quadrant, string>;
  fontChoice: FontChoice;            // default: 'cormorant'
  matrixStyle: MatrixStyle;          // default: 'tinted'
  mitResetHour: number;              // default: 0  (midnight, 0–23)
  fontSizeMultiplier: number;        // default: 1.0, range: 0.85–1.3
}

export interface SparkSuggestion {
  quadrant: Quadrant;
  domain: AgendaDomain;
  time: AgendaTime;
  urgency: number;
  importance: number;
  refined: string;
}

export interface PulseInsight {
  title: string;
  lines: string[];
}

export const QUADRANT_META: Record<Quadrant, { label: string; color: string; soft: string }> = {
  Q1: { label: 'Do Now', color: '#FF5C5C', soft: 'rgba(255,92,92,0.16)' },
  Q2: { label: 'Schedule', color: '#2ECC8F', soft: 'rgba(46,204,143,0.16)' },
  Q3: { label: 'Delegate', color: '#5B9BFF', soft: 'rgba(91,155,255,0.16)' },
  Q4: { label: 'Eliminate', color: '#6B6B82', soft: 'rgba(107,107,130,0.16)' },
};

export const TIME_LABELS: Record<AgendaTime, string> = {
  quick: '⚡',
  short: '◔',
  medium: '◑',
  deep: '●',
};
