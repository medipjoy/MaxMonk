import { Quadrant } from '../store/types';

export function assignQuadrant(urgency: number, importance: number): Quadrant {
  const isUrgent = urgency >= 5;
  const isImportant = importance >= 5;
  if (isUrgent && isImportant) return 'Q1';
  if (!isUrgent && isImportant) return 'Q2';
  if (isUrgent && !isImportant) return 'Q3';
  return 'Q4';
}

export function getQuadrantLabel(q: Quadrant): string {
  const map = { Q1: 'Do Now', Q2: 'Plan', Q3: 'Delegate', Q4: 'Drop' };
  return map[q];
}
