import { Quadrant } from './types';

export const STORAGE_KEYS = {
  moves: 'cd-mv',
  vault: 'cd-vt',
  config: 'cd-cfg',
  addDraft: 'cd-ad',
  editDraftPrefix: 'cd-ed:',
};

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function qFromPos(cx: number, cy: number): Quadrant {
  if (cx > 0.5 && cy < 0.5) return 'Q1';
  if (cx <= 0.5 && cy < 0.5) return 'Q2';
  if (cx > 0.5 && cy >= 0.5) return 'Q3';
  return 'Q4';
}

export function isCenterPoint(cx: number, cy: number, epsilon = 0.006): boolean {
  return Math.abs(cx - 0.5) <= epsilon && Math.abs(cy - 0.5) <= epsilon;
}

export function posFromSliders(urgency: number, importance: number): { cx: number; cy: number } {
  const cx = 0.05 + (clamp(urgency, 0, 100) / 100) * 0.9;
  const cy = 0.05 + ((100 - clamp(importance, 0, 100)) / 100) * 0.9;
  return { cx: clamp(cx, 0.03, 0.97), cy: clamp(cy, 0.03, 0.97) };
}

export function slidersFromPos(cx: number, cy: number): { urgency: number; importance: number } {
  const urgency = ((clamp(cx, 0.05, 0.95) - 0.05) / 0.9) * 100;
  const importance = 100 - ((clamp(cy, 0.05, 0.95) - 0.05) / 0.9) * 100;
  return {
    urgency: Math.round(clamp(urgency, 0, 100)),
    importance: Math.round(clamp(importance, 0, 100)),
  };
}

export function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `cd-mit-${yyyy}-${mm}-${dd}`;
}

export const EXPIRY_DAYS = 60;
