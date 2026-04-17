import { Agenda, AgendaTime, Quadrant } from './types';

export const STORAGE_KEYS = {
  moves: 'cd-mv',
  vault: 'cd-vt',
  config: 'cd-cfg',
  addDraft: 'cd-ad',
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
    urgency: Math.round(clamp(urgency, 5, 95)),
    importance: Math.round(clamp(importance, 5, 95)),
  };
}

export function getR(time: AgendaTime): number {
  if (time === 'quick') return 20;
  if (time === 'short') return 29;
  if (time === 'medium') return 38;
  return 50;
}

export function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `cd-mit-${yyyy}-${mm}-${dd}`;
}

export function summarizeBubble(text: string, _time: AgendaTime, maxChars = 25): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}

export function randomPosInQuadrant(q: Quadrant): { cx: number; cy: number } {
  const rand = (min: number, max: number) => min + Math.random() * (max - min);
  if (q === 'Q1') return { cx: rand(0.56, 0.94), cy: rand(0.06, 0.44) };
  if (q === 'Q2') return { cx: rand(0.06, 0.44), cy: rand(0.06, 0.44) };
  if (q === 'Q3') return { cx: rand(0.56, 0.94), cy: rand(0.56, 0.94) };
  return { cx: rand(0.06, 0.44), cy: rand(0.56, 0.94) };
}

export const EXPIRY_DAYS = 60;

export function getVaultDaysLeft(archivedAt: number): number {
  const elapsed = Date.now() - archivedAt;
  const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
  return Math.max(0, EXPIRY_DAYS - days);
}

export function isExpired(archivedAt: number): boolean {
  return getVaultDaysLeft(archivedAt) === 0;
}

export function countByQuadrant(agendas: Agenda[]): Record<Quadrant, number> {
  return agendas.reduce(
    (acc, agenda) => {
      acc[agenda.quadrant] += 1;
      return acc;
    },
    { Q1: 0, Q2: 0, Q3: 0, Q4: 0 } as Record<Quadrant, number>,
  );
}
