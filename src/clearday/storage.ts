import { Platform } from 'react-native';
import { Agenda, AgendaDomain, AgendaTime, AppConfig, DEFAULT_QUADRANT_LABELS, DEFAULT_TAGS, Spark, VaultEntry } from './types';
import { STORAGE_KEYS, todayKey } from './helpers';

let asyncStorage: any = null;

async function getAsyncStorage() {
  if (!asyncStorage) {
    const mod = await import('@react-native-async-storage/async-storage');
    asyncStorage = mod.default;
  }
  return asyncStorage;
}

async function getItem<T>(key: string, fallback: T): Promise<T> {
  const storage = await getAsyncStorage();
  const raw = await storage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  const storage = await getAsyncStorage();
  await storage.setItem(key, JSON.stringify(value));
}

async function removeItem(key: string): Promise<void> {
  const storage = await getAsyncStorage();
  await storage.removeItem(key);
}

export async function loadAgendas(): Promise<Agenda[]> {
  return getItem<Agenda[]>(STORAGE_KEYS.moves, []);
}

export async function saveAgendas(agendas: Agenda[]): Promise<void> {
  await setItem(STORAGE_KEYS.moves, agendas);
}

export async function loadVault(): Promise<VaultEntry[]> {
  return getItem<VaultEntry[]>(STORAGE_KEYS.vault, []);
}

export async function saveVault(vault: VaultEntry[]): Promise<void> {
  await setItem(STORAGE_KEYS.vault, vault);
}

export async function loadSparks(): Promise<Spark[]> {
  return getItem<Spark[]>(STORAGE_KEYS.sparks, []);
}

export async function saveSparks(sparks: Spark[]): Promise<void> {
  await setItem(STORAGE_KEYS.sparks, sparks);
}

export async function loadConfig(): Promise<AppConfig> {
  return getItem<AppConfig>(STORAGE_KEYS.config, {
    name: 'Me',
    migratedV1: false,
    themeMode: 'light',
    vaultExpiryDefault: 'on_60d',
    holdExpiryDefault: 'off',
    tags: [...DEFAULT_TAGS],
    quadrantLabels: { ...DEFAULT_QUADRANT_LABELS },
    fontChoice: 'cormorant',
    matrixStyle: 'tinted',
    mitResetHour: 0,
    fontSizeMultiplier: 1.0,
  });
}

export async function saveConfig(cfg: AppConfig): Promise<void> {
  await setItem(STORAGE_KEYS.config, cfg);
}

export async function loadTodayMit(): Promise<string> {
  return getItem<string>(todayKey(), '');
}

export async function saveTodayMit(value: string): Promise<void> {
  await setItem(todayKey(), value);
}

export interface AddDraft {
  text: string;
  urgency: number;
  importance: number;
  domain: AgendaDomain;
  time: AgendaTime;
  updatedAt: number;
}

export async function loadAddDraft(): Promise<AddDraft | null> {
  return getItem<AddDraft | null>(STORAGE_KEYS.addDraft, null);
}

export async function saveAddDraft(draft: AddDraft): Promise<void> {
  await setItem(STORAGE_KEYS.addDraft, draft);
}

export async function clearAddDraft(): Promise<void> {
  await removeItem(STORAGE_KEYS.addDraft);
}

export async function getLegacyWebTasks(): Promise<any[]> {
  const storage = await getAsyncStorage();
  const raw = await storage.getItem('@maxmonk_tasks');
  if (!raw) return [];
  try {
    return JSON.parse(raw) as any[];
  } catch {
    return [];
  }
}

export async function getLegacyNativeTasks(): Promise<any[]> {
  if (Platform.OS === 'web') return [];
  try {
    const db = await (require('./sqliteWeb') as typeof import('./sqliteWeb')).openDatabaseAsync('maxmonk.db');
    const rows = await db.getAllAsync('SELECT * FROM tasks ORDER BY createdAt DESC');
    return (rows ?? []) as any[];
  } catch {
    return [];
  }
}
