import { create } from 'zustand';
import { Task, Quadrant } from './types';
import { getAllTasks, insertTask, updateTask, deleteTask, completeTask } from '../db/taskRepository';
import { assignQuadrant } from '../utils/quadrant';
import { escalateDeadlines } from '../utils/deadlineEscalation';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  loadTasks: () => Promise<void>;
  addTask: (data: { title: string; description?: string; urgency: number; importance: number; dueDate?: string; scheduledAt?: string }) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  getTasksByQuadrant: (quadrant: Quadrant) => Task[];
  getActiveTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getUpcomingTasks: () => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,

  loadTasks: async () => {
    set({ isLoading: true });
    const raw = await getAllTasks();
    const tasks = escalateDeadlines(raw);
    set({ tasks, isLoading: false });
  },

  addTask: async ({ title, description, urgency, importance, dueDate, scheduledAt }) => {
    const quadrant = assignQuadrant(urgency, importance);
    const task: Task = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      title,
      description,
      urgency,
      importance,
      quadrant,
      dueDate,
      scheduledAt,
      createdAt: new Date().toISOString(),
    };
    await insertTask(task);
    set(state => ({ tasks: [task, ...state.tasks] }));
  },

  updateTask: async (task: Task) => {
    task.quadrant = assignQuadrant(task.urgency, task.importance);
    await updateTask(task);
    set(state => ({ tasks: state.tasks.map(t => t.id === task.id ? task : t) }));
  },

  deleteTask: async (id: string) => {
    await deleteTask(id);
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },

  completeTask: async (id: string) => {
    await completeTask(id);
    const completedAt = new Date().toISOString();
    set(state => ({ tasks: state.tasks.map(t => t.id === id ? { ...t, completedAt } : t) }));
  },

  getTasksByQuadrant: (quadrant: Quadrant) => {
    return get().tasks.filter(t => t.quadrant === quadrant && !t.completedAt);
  },

  getActiveTasks: () => get().tasks.filter(t => !t.completedAt),

  getCompletedTasks: () => get().tasks.filter(t => !!t.completedAt),

  getUpcomingTasks: () => {
    return get().tasks
      .filter(t => !t.completedAt && (t.scheduledAt || t.dueDate))
      .sort((a, b) => {
        const aDate = new Date(a.scheduledAt || a.dueDate!).getTime();
        const bDate = new Date(b.scheduledAt || b.dueDate!).getTime();
        return aDate - bDate;
      });
  },
}));
