import { Platform } from 'react-native';
import { Task } from '../store/types';

// Web: AsyncStorage  |  Native: expo-sqlite

let _asyncStorage: any = null;
async function getAsyncStorage() {
  if (!_asyncStorage) {
    const mod = await import('@react-native-async-storage/async-storage');
    _asyncStorage = mod.default;
  }
  return _asyncStorage;
}

let _db: any = null;
async function getSQLiteDb() {
  if (!_db) {
    const SQLite = await import('expo-sqlite');
    _db = await SQLite.openDatabaseAsync('maxmonk.db');
    await _db.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        urgency REAL NOT NULL DEFAULT 5,
        importance REAL NOT NULL DEFAULT 5,
        quadrant TEXT NOT NULL DEFAULT 'Q1',
        dueDate TEXT,
        scheduledAt TEXT,
        completedAt TEXT,
        createdAt TEXT NOT NULL
      );
    `);
  }
  return _db;
}

const WEB_KEY = '@maxmonk_tasks';

export async function dbGetAllTasks(): Promise<Task[]> {
  if (Platform.OS === 'web') {
    const s = await getAsyncStorage();
    const raw = await s.getItem(WEB_KEY);
    return raw ? JSON.parse(raw) : [];
  }
  const db = await getSQLiteDb();
  return db.getAllAsync('SELECT * FROM tasks ORDER BY createdAt DESC') as Promise<Task[]>;
}

async function webSave(tasks: Task[]) {
  const s = await getAsyncStorage();
  await s.setItem(WEB_KEY, JSON.stringify(tasks));
}

export async function dbInsertTask(task: Task): Promise<void> {
  if (Platform.OS === 'web') {
    const all = await dbGetAllTasks();
    await webSave([task, ...all]);
    return;
  }
  const db = await getSQLiteDb();
  await db.runAsync(
    `INSERT INTO tasks (id,title,description,urgency,importance,quadrant,dueDate,scheduledAt,completedAt,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [task.id, task.title, task.description ?? null, task.urgency, task.importance, task.quadrant,
     task.dueDate ?? null, task.scheduledAt ?? null, task.completedAt ?? null, task.createdAt]
  );
}

export async function dbUpdateTask(task: Task): Promise<void> {
  if (Platform.OS === 'web') {
    const all = await dbGetAllTasks();
    await webSave(all.map(t => t.id === task.id ? task : t));
    return;
  }
  const db = await getSQLiteDb();
  await db.runAsync(
    `UPDATE tasks SET title=?,description=?,urgency=?,importance=?,quadrant=?,dueDate=?,scheduledAt=?,completedAt=? WHERE id=?`,
    [task.title, task.description ?? null, task.urgency, task.importance, task.quadrant,
     task.dueDate ?? null, task.scheduledAt ?? null, task.completedAt ?? null, task.id]
  );
}

export async function dbDeleteTask(id: string): Promise<void> {
  if (Platform.OS === 'web') {
    const all = await dbGetAllTasks();
    await webSave(all.filter(t => t.id !== id));
    return;
  }
  const db = await getSQLiteDb();
  await db.runAsync('DELETE FROM tasks WHERE id=?', [id]);
}

export async function dbCompleteTask(id: string): Promise<void> {
  const completedAt = new Date().toISOString();
  if (Platform.OS === 'web') {
    const all = await dbGetAllTasks();
    await webSave(all.map(t => t.id === id ? { ...t, completedAt } : t));
    return;
  }
  const db = await getSQLiteDb();
  await db.runAsync('UPDATE tasks SET completedAt=? WHERE id=?', [completedAt, id]);
}
