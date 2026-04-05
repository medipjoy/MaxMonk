export type Quadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface Task {
  id: string;
  title: string;
  description?: string;
  urgency: number;      // 0–10
  importance: number;   // 0–10
  quadrant: Quadrant;
  dueDate?: string;     // ISO string
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface QuadrantConfig {
  id: Quadrant;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
}

export const QUADRANTS: QuadrantConfig[] = [
  { id: 'Q1', label: 'Do Now', emoji: '🔥', color: '#ef4444', bgColor: '#fef2f2', description: 'Urgent & Important' },
  { id: 'Q2', label: 'Plan', emoji: '🎯', color: '#3b82f6', bgColor: '#eff6ff', description: 'Not Urgent & Important' },
  { id: 'Q3', label: 'Delegate', emoji: '⚡', color: '#f97316', bgColor: '#fff7ed', description: 'Urgent & Not Important' },
  { id: 'Q4', label: 'Drop', emoji: '🗑', color: '#6b7280', bgColor: '#f9fafb', description: 'Not Urgent & Not Important' },
];
