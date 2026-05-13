export type Quadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type AgendaDomain = string;
export type AgendaTime = 'quick' | 'short' | 'medium' | 'deep';
export type AgendaStatus = 'active' | 'onhold' | 'done';
export type ThemeMode = 'system' | 'light' | 'dark';
export type MatrixStyle = 'tinted' | 'editorial' | 'paper';
export type FontChoice = 'cormorant' | 'baskerville' | 'inter' | 'jakarta';
export type ExpiryDefault = 'off' | 'on_60d';
export const DEFAULT_TAGS = ['Pro', 'Per'] as const;
export const TAG_MAX_LENGTH = 3;
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
  listOrder?: number;
  cx: number;
  cy: number;
  createdAt: number;
  doneAt?: number;
  onHoldAt?: number;
}

export interface VaultEntry extends Agenda {
  archivedAt: number;
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
  vaultRetentionDays: number;        // default: 0; 0 = never auto-delete
}

