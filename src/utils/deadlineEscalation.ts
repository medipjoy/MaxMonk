import { Task } from '../store/types';
import { assignQuadrant } from './quadrant';

export function escalateDeadlines(tasks: Task[]): Task[] {
  const now = new Date();
  return tasks.map(task => {
    if (!task.dueDate || task.completedAt) return task;
    const due = new Date(task.dueDate);
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilDue <= 0) {
      return { ...task, urgency: 10, quadrant: 'Q1' };
    }
    if (hoursUntilDue <= 24) {
      const newUrgency = Math.max(task.urgency, 8);
      return { ...task, urgency: newUrgency, quadrant: assignQuadrant(newUrgency, task.importance) };
    }
    if (hoursUntilDue <= 72) {
      const newUrgency = Math.max(task.urgency, 6);
      return { ...task, urgency: newUrgency, quadrant: assignQuadrant(newUrgency, task.importance) };
    }
    return task;
  });
}

export function getDeadlineLabel(dueDate: string): { label: string; color: string } {
  const now = new Date();
  const due = new Date(dueDate);
  const hours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hours < 0) return { label: 'Overdue', color: '#dc2626' };
  if (hours <= 24) return { label: 'Due Today', color: '#ef4444' };
  if (hours <= 48) return { label: 'Due Tomorrow', color: '#f97316' };
  if (hours <= 72) return { label: 'Due in 3 days', color: '#eab308' };
  return { label: `Due ${due.toLocaleDateString()}`, color: '#6b7280' };
}
