import { Agenda, AppConfig, DEFAULT_QUADRANT_LABELS, VaultEntry } from './types';
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

export async function loadConfig(): Promise<AppConfig> {
  return getItem<AppConfig>(STORAGE_KEYS.config, {
    name: 'Me',
    migratedV1: false,
    themeMode: 'light',
    vaultExpiryDefault: 'on_60d',
    holdExpiryDefault: 'off',
    tags: ['Pro', 'Per'],
    quadrantLabels: { ...DEFAULT_QUADRANT_LABELS },
    fontChoice: 'cormorant',
    matrixStyle: 'tinted',
    mitResetHour: 0,
    fontSizeMultiplier: 1.0,
    vaultRetentionDays: 0,
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

export interface SheetDraft {
  text: string;
  urgency: number;
  importance: number;
  effort: number;
  domain: string;
  isMIT?: boolean;
  updatedAt: number;
}

export async function loadAddDraft(): Promise<SheetDraft | null> {
  return getItem<SheetDraft | null>(STORAGE_KEYS.addDraft, null);
}

export async function saveAddDraft(draft: SheetDraft): Promise<void> {
  await setItem(STORAGE_KEYS.addDraft, draft);
}

export async function clearAddDraft(): Promise<void> {
  await removeItem(STORAGE_KEYS.addDraft);
}

function editDraftKey(agendaId: string): string {
  return `${STORAGE_KEYS.editDraftPrefix}${agendaId}`;
}

export async function loadEditDraft(agendaId: string): Promise<SheetDraft | null> {
  return getItem<SheetDraft | null>(editDraftKey(agendaId), null);
}

export async function saveEditDraft(agendaId: string, draft: SheetDraft): Promise<void> {
  await setItem(editDraftKey(agendaId), draft);
}

export async function clearEditDraft(agendaId: string): Promise<void> {
  await removeItem(editDraftKey(agendaId));
}

export async function purgeStaleEditDrafts(activeIds: string[]): Promise<void> {
  const storage = await getAsyncStorage();
  const keys: string[] = await storage.getAllKeys();
  const prefix = STORAGE_KEYS.editDraftPrefix;
  const valid = new Set(activeIds);
  const stale = keys.filter((k) => k.startsWith(prefix) && !valid.has(k.slice(prefix.length)));
  if (stale.length) await storage.multiRemove(stale);
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
  // SQLite migration bridge removed — legacy data has already been migrated to AsyncStorage
  return [];
}
