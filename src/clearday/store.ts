import { create } from 'zustand';
import { pulse, reflectDay, suggestFromSpark } from './aiStub';
import { EXPIRY_DAYS, isCenterPoint, posFromSliders, qFromPos, uid } from './helpers';
import { runMigrationIfNeeded } from './migration';
import {
  loadAgendas,
  loadConfig,
  loadSparks,
  loadTodayMit,
  loadVault,
  saveAgendas,
  saveConfig,
  saveSparks,
  saveTodayMit,
  saveVault,
} from './storage';
import {
  Agenda,
  AGENDA_TITLE_MAX_LENGTH,
  AgendaDomain,
  AgendaTime,
  AppConfig,
  DEFAULT_QUADRANT_LABELS,
  DEFAULT_TAGS,
  ExpiryDefault,
  PulseInsight,
  Quadrant,
  QUADRANT_LABEL_MAX_LENGTH,
  Spark,
  SparkSuggestion,
  TAG_MAX_LENGTH,
  ThemeMode,
  VaultEntry,
} from './types';

interface ClearDayState {
  ready: boolean;
  agendas: Agenda[];
  vault: VaultEntry[];
  sparks: Spark[];
  mit: string;
  config: AppConfig;
  reflection: string;
  weeklyPulse: PulseInsight | null;
  monthlyPulse: PulseInsight | null;

  bootstrap: () => Promise<void>;
  setName: (name: string) => Promise<void>;
  setThemeMode: (themeMode: ThemeMode) => Promise<void>;
  setVaultExpiryDefault: (value: ExpiryDefault) => Promise<void>;
  setHoldExpiryDefault: (value: ExpiryDefault) => Promise<void>;
  setTags: (tags: string[]) => Promise<void>;
  setQuadrantLabel: (quadrant: Quadrant, label: string) => Promise<boolean>;
  addTag: (tag: string) => Promise<boolean>;
  removeTag: (tag: string) => Promise<boolean>;
  renameTag: (oldTag: string, newTag: string) => Promise<boolean>;
  setMit: (mit: string) => Promise<void>;

  addAgenda: (input: {
    text: string;
    domain: AgendaDomain;
    time: AgendaTime;
    urgency: number;
    importance: number;
  }) => Promise<Agenda | null>;
  addSpark: (text: string) => Promise<void>;
  removeSpark: (id: string) => Promise<void>;
  suggestSpark: (spark: Spark) => Promise<SparkSuggestion>;
  acceptSpark: (sparkId: string, suggestion: SparkSuggestion) => Promise<void>;

  updateAgendaPosition: (id: string, cx: number, cy: number) => Promise<void>;
  completeAgenda: (id: string) => Promise<void>;
  toggleHold: (id: string) => Promise<void>;
  setAgendaMit: (id: string) => Promise<void>;
  updateAgenda: (id: string, patch: Partial<Pick<Agenda, 'text' | 'domain' | 'time' | 'cx' | 'cy'>>) => Promise<void>;

  archiveAgenda: (id: string) => Promise<void>;
  restoreVaultAgenda: (id: string) => Promise<void>;
  deleteVaultAgenda: (id: string) => Promise<void>;

  bulkArchiveToVault: (ids: string[]) => Promise<void>;
  bulkHold: (ids: string[]) => Promise<void>;
  bulkResume: (ids: string[]) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;

  runReflection: () => Promise<void>;
  runPulse: (period: 'week' | 'month') => Promise<void>;
}

async function persistSnapshot(state: Pick<ClearDayState, 'agendas' | 'vault' | 'sparks'>): Promise<void> {
  await Promise.all([saveAgendas(state.agendas), saveVault(state.vault), saveSparks(state.sparks)]);
}

function expiryDaysPassed(fromTs: number): number {
  const elapsed = Date.now() - fromTs;
  return Math.floor(elapsed / (1000 * 60 * 60 * 24));
}

function applyHoldExpiryPolicy(agendas: Agenda[], holdExpiryDefault: ExpiryDefault): { agendas: Agenda[]; vault: VaultEntry[] } {
  if (holdExpiryDefault !== 'on_60d') {
    return { agendas, vault: [] };
  }
  const keep: Agenda[] = [];
  const vaulted: VaultEntry[] = [];
  agendas.forEach((agenda) => {
    if (agenda.status !== 'onhold' || !agenda.onHoldAt) {
      keep.push(agenda);
      return;
    }
    if (expiryDaysPassed(agenda.onHoldAt) < EXPIRY_DAYS) {
      keep.push(agenda);
      return;
    }
    vaulted.push({ ...agenda, archivedAt: Date.now() });
  });
  return { agendas: keep, vault: vaulted };
}

function normalizeTagList(input: string[]): string[] {
  const next: string[] = [];
  input.forEach((tag) => {
    const clean = tag.trim();
    if (!clean) return;
    if (clean.length > TAG_MAX_LENGTH) return;
    if (next.some((v) => v.toLowerCase() === clean.toLowerCase())) return;
    if (next.length >= 4) return;
    next.push(clean);
  });
  return next.length > 0 ? next : [...DEFAULT_TAGS];
}

function normalizeQuadrantLabels(input?: Partial<Record<Quadrant, string>>): Record<Quadrant, string> {
  const next: Record<Quadrant, string> = { ...DEFAULT_QUADRANT_LABELS };
  const legacyFix: Record<string, string> = { Eliminat: 'Eliminate', Delegat: 'Delegate' };
  (Object.keys(DEFAULT_QUADRANT_LABELS) as Quadrant[]).forEach((quadrant) => {
    const raw = input?.[quadrant];
    const clean = raw?.trim();
    if (!clean) return;
    next[quadrant] = (legacyFix[clean] ?? clean).slice(0, QUADRANT_LABEL_MAX_LENGTH);
  });
  return next;
}

function resolveTag(value: string | undefined, tags: string[]): string {
  if (!value) return tags[0];
  const found = tags.find((t) => t.toLowerCase() === value.trim().toLowerCase());
  if (found) return found;
  if (value === 'professional') return tags[0] || 'Professional';
  if (value === 'personal') return tags[1] || tags[0] || 'Personal';
  return tags[0];
}

export const useClearDayStore = create<ClearDayState>((set, get) => ({
  ready: false,
  agendas: [],
  vault: [],
  sparks: [],
  mit: '',
  config: {
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
  },
  reflection: '',
  weeklyPulse: null,
  monthlyPulse: null,

  bootstrap: async () => {
    await runMigrationIfNeeded();
    const [loadedAgendas, loadedVault, sparks, mit, rawConfig] = await Promise.all([
      loadAgendas(),
      loadVault(),
      loadSparks(),
      loadTodayMit(),
      loadConfig(),
    ]);
    const tags = normalizeTagList(rawConfig.tags ?? [...DEFAULT_TAGS]);
    const config: AppConfig = {
      name: rawConfig.name || 'Me',
      migratedV1: !!rawConfig.migratedV1,
      themeMode: rawConfig.themeMode || 'light',
      vaultExpiryDefault: rawConfig.vaultExpiryDefault || 'on_60d',
      holdExpiryDefault: rawConfig.holdExpiryDefault || 'off',
      tags,
      quadrantLabels: normalizeQuadrantLabels(rawConfig.quadrantLabels),
      fontChoice: rawConfig.fontChoice || 'cormorant',
      matrixStyle: rawConfig.matrixStyle || 'tinted',
      mitResetHour: rawConfig.mitResetHour ?? 0,
      fontSizeMultiplier: rawConfig.fontSizeMultiplier ?? 1.0,
    };
    const normalizedAgendas = loadedAgendas.map((a) => ({ ...a, domain: resolveTag(a.domain, tags) }));
    const normalizedVault = loadedVault.map((v) => ({ ...v, domain: resolveTag(v.domain, tags) }));
    const holdPolicy = applyHoldExpiryPolicy(normalizedAgendas, config.holdExpiryDefault);
    const agendas = holdPolicy.agendas;
    const vault = [...holdPolicy.vault, ...normalizedVault];

    set({ agendas, vault, sparks, mit, config, ready: true });

    const tagsChanged = JSON.stringify(rawConfig.tags ?? []) !== JSON.stringify(tags);
    if (holdPolicy.vault.length > 0 || tagsChanged) {
      await Promise.all([saveAgendas(agendas), saveVault(vault), saveConfig(config)]);
    }
  },

  setName: async (name: string) => {
    const next = { ...get().config, name: name.trim() || 'Me' };
    set({ config: next });
    await saveConfig(next);
  },

  setThemeMode: async (themeMode: ThemeMode) => {
    const next = { ...get().config, themeMode };
    set({ config: next });
    await saveConfig(next);
  },

  setVaultExpiryDefault: async (value: ExpiryDefault) => {
    const next = { ...get().config, vaultExpiryDefault: value };
    set({ config: next });
    await saveConfig(next);
  },

  setHoldExpiryDefault: async (value: ExpiryDefault) => {
    const next = { ...get().config, holdExpiryDefault: value };
    let agendas = get().agendas;
    let vault = get().vault;

    if (value === 'on_60d') {
      agendas = agendas.map((a) => (a.status === 'onhold' && !a.onHoldAt ? { ...a, onHoldAt: Date.now() } : a));
      const sweep = applyHoldExpiryPolicy(agendas, value);
      agendas = sweep.agendas;
      vault = [...sweep.vault, ...vault];
    } else {
      agendas = agendas.map((a) => (a.status === 'onhold' ? { ...a, onHoldAt: undefined } : a));
    }

    set({ config: next, agendas, vault });
    await Promise.all([saveConfig(next), saveAgendas(agendas), saveVault(vault)]);
  },

  setTags: async (tags: string[]) => {
    const nextTags = normalizeTagList(tags);
    const nextCfg = { ...get().config, tags: nextTags };
    const agendas = get().agendas.map((a) => ({ ...a, domain: resolveTag(a.domain, nextTags) }));
    const vault = get().vault.map((v) => ({ ...v, domain: resolveTag(v.domain, nextTags) }));
    set({ config: nextCfg, agendas, vault });
    await Promise.all([saveConfig(nextCfg), saveAgendas(agendas), saveVault(vault)]);
  },

  setQuadrantLabel: async (quadrant: Quadrant, label: string) => {
    const clean = label.trim();
    if (!clean) return false;
    const nextCfg = {
      ...get().config,
      quadrantLabels: {
        ...get().config.quadrantLabels,
        [quadrant]: clean.slice(0, QUADRANT_LABEL_MAX_LENGTH),
      },
    };
    set({ config: nextCfg });
    await saveConfig(nextCfg);
    return true;
  },

  addTag: async (tag: string) => {
    const clean = tag.trim();
    if (!clean || clean.length > TAG_MAX_LENGTH) return false;
    const tags = get().config.tags ?? [...DEFAULT_TAGS];
    if (tags.length >= 4) return false;
    if (tags.some((t) => t.toLowerCase() === clean.toLowerCase())) return false;
    const next = [...tags, clean];
    await get().setTags(next);
    return true;
  },

  removeTag: async (tag: string) => {
    const tags = get().config.tags ?? [...DEFAULT_TAGS];
    if (tags.length <= 1) return false;
    if (!tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return false;
    const next = tags.filter((t) => t.toLowerCase() !== tag.toLowerCase());
    await get().setTags(next);
    return true;
  },

  renameTag: async (oldTag: string, newTag: string) => {
    const oldClean = oldTag.trim();
    const newClean = newTag.trim();
    if (!oldClean || !newClean || newClean.length > TAG_MAX_LENGTH) return false;
    const tags = get().config.tags ?? [...DEFAULT_TAGS];
    const oldIdx = tags.findIndex((t) => t.toLowerCase() === oldClean.toLowerCase());
    if (oldIdx < 0) return false;
    if (tags.some((t, idx) => idx !== oldIdx && t.toLowerCase() === newClean.toLowerCase())) return false;
    const nextTags = [...tags];
    nextTags[oldIdx] = newClean;
    const agendas = get().agendas.map((a) =>
      a.domain.toLowerCase() === oldClean.toLowerCase() ? { ...a, domain: newClean } : a,
    );
    const vault = get().vault.map((v) =>
      v.domain.toLowerCase() === oldClean.toLowerCase() ? { ...v, domain: newClean } : v,
    );
    const nextCfg = { ...get().config, tags: nextTags };
    set({ config: nextCfg, agendas, vault });
    await Promise.all([saveConfig(nextCfg), saveAgendas(agendas), saveVault(vault)]);
    return true;
  },

  setMit: async (mit: string) => {
    set({ mit });
    await saveTodayMit(mit);
  },

  addAgenda: async ({ text, domain, time, urgency, importance }) => {
    const clean = text.trim().slice(0, AGENDA_TITLE_MAX_LENGTH);
    if (!clean) return null;
    const { cx, cy } = posFromSliders(urgency, importance);
    const tag = resolveTag(domain, get().config.tags);
    const agenda: Agenda = {
      id: uid(),
      text: clean,
      domain: tag,
      time,
      cx,
      cy,
      quadrant: qFromPos(cx, cy),
      status: 'active',
      createdAt: Date.now(),
    };
    const agendas = [agenda, ...get().agendas];
    set({ agendas });
    await saveAgendas(agendas);
    return agenda;
  },

  addSpark: async (text: string) => {
    const clean = text.trim().slice(0, AGENDA_TITLE_MAX_LENGTH);
    if (!clean) return;
    const spark: Spark = { id: uid(), text: clean, createdAt: Date.now() };
    const sparks = [spark, ...get().sparks];
    set({ sparks });
    await saveSparks(sparks);
  },

  removeSpark: async (id: string) => {
    const sparks = get().sparks.filter((s) => s.id !== id);
    set({ sparks });
    await saveSparks(sparks);
  },

  suggestSpark: async (spark: Spark) => {
    const base = await suggestFromSpark(spark.text);
    const tags = get().config.tags;
    const hash = spark.text
      .split('')
      .reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0);
    const fallbackTag = tags[Math.abs(hash) % tags.length] || tags[0] || DEFAULT_TAGS[0];
    return { ...base, domain: resolveTag(base.domain || fallbackTag, tags) };
  },

  acceptSpark: async (sparkId: string, suggestion: SparkSuggestion) => {
    const { cx, cy } = posFromSliders(suggestion.urgency, suggestion.importance);
    const tag = resolveTag(suggestion.domain, get().config.tags);
    const agenda: Agenda = {
      id: uid(),
      text: suggestion.refined.trim().slice(0, AGENDA_TITLE_MAX_LENGTH),
      domain: tag,
      time: suggestion.time,
      cx,
      cy,
      quadrant: qFromPos(cx, cy),
      status: 'active',
      createdAt: Date.now(),
    };
    const agendas = [agenda, ...get().agendas];
    const sparks = get().sparks.filter((s) => s.id !== sparkId);
    set({ agendas, sparks });
    await Promise.all([saveAgendas(agendas), saveSparks(sparks)]);
  },

  updateAgendaPosition: async (id: string, cx: number, cy: number) => {
    const agendas = get().agendas.map((a) => {
      if (a.id !== id) return a;
      const nextQuadrant = isCenterPoint(cx, cy) ? a.quadrant : qFromPos(cx, cy);
      return { ...a, cx, cy, quadrant: nextQuadrant };
    });
    set({ agendas });
    await saveAgendas(agendas);
  },

  completeAgenda: async (id: string) => {
    const agendas = get().agendas.map((a) => (a.id === id ? { ...a, status: 'done' as const, doneAt: Date.now() } : a));
    set({ agendas });
    await saveAgendas(agendas);
  },

  toggleHold: async (id: string) => {
    const holdExpiryOn = get().config.holdExpiryDefault === 'on_60d';
    const agendas = get().agendas.map((a) => {
      if (a.id !== id) return a;
      if (a.status === 'onhold') {
        return { ...a, status: 'active' as const, onHoldAt: undefined };
      }
      return { ...a, status: 'onhold' as const, onHoldAt: holdExpiryOn ? Date.now() : undefined };
    });
    set({ agendas });
    await saveAgendas(agendas);
  },

  setAgendaMit: async (id: string) => {
    const agenda = get().agendas.find((a) => a.id === id);
    if (!agenda) return;
    set({ mit: agenda.text });
    await saveTodayMit(agenda.text);
  },

  updateAgenda: async (id: string, patch) => {
    const tags = get().config.tags;
    const agendas = get().agendas.map((a) => {
      if (a.id !== id) return a;
      const next = { ...a, ...patch };
      if (typeof next.text === 'string') {
        next.text = next.text.trim().slice(0, AGENDA_TITLE_MAX_LENGTH);
      }
      if (typeof patch.domain === 'string') {
        next.domain = resolveTag(patch.domain, tags);
      }
      if (typeof next.cx === 'number' && typeof next.cy === 'number') {
        next.quadrant = isCenterPoint(next.cx, next.cy) ? a.quadrant : qFromPos(next.cx, next.cy);
      }
      return next;
    });
    set({ agendas });
    await saveAgendas(agendas);
  },

  archiveAgenda: async (id: string) => {
    const agenda = get().agendas.find((a) => a.id === id);
    if (!agenda) return;
    const agendas = get().agendas.filter((a) => a.id !== id);
    const entry: VaultEntry = { ...agenda, archivedAt: Date.now() };
    const vault = [entry, ...get().vault];
    set({ agendas, vault });
    await persistSnapshot({ agendas, vault, sparks: get().sparks });
  },

  restoreVaultAgenda: async (id: string) => {
    const entry = get().vault.find((v) => v.id === id);
    if (!entry) return;
    const vault = get().vault.filter((v) => v.id !== id);
    const { archivedAt, ...agenda } = entry;
    const agendas = [{ ...agenda, status: 'active' as const, onHoldAt: undefined }, ...get().agendas];
    set({ agendas, vault });
    await persistSnapshot({ agendas, vault, sparks: get().sparks });
  },

  deleteVaultAgenda: async (id: string) => {
    const vault = get().vault.filter((v) => v.id !== id);
    set({ vault });
    await saveVault(vault);
  },

  bulkArchiveToVault: async (ids: string[]) => {
    const idSet = new Set(ids);
    const now = Date.now();
    const toVault = get().agendas.filter((a) => idSet.has(a.id)).map((a) => ({ ...a, archivedAt: now }));
    const agendas = get().agendas.filter((a) => !idSet.has(a.id));
    const vault = [...toVault, ...get().vault];
    set({ agendas, vault });
    await persistSnapshot({ agendas, vault, sparks: get().sparks });
  },

  bulkHold: async (ids: string[]) => {
    const idSet = new Set(ids);
    const holdExpiryOn = get().config.holdExpiryDefault === 'on_60d';
    const agendas = get().agendas.map((a) => {
      if (!idSet.has(a.id) || a.status === 'done') return a;
      return { ...a, status: 'onhold' as const, onHoldAt: holdExpiryOn ? Date.now() : undefined };
    });
    set({ agendas });
    await saveAgendas(agendas);
  },

  bulkResume: async (ids: string[]) => {
    const idSet = new Set(ids);
    const agendas = get().agendas.map((a) => {
      if (!idSet.has(a.id) || a.status !== 'onhold') return a;
      return { ...a, status: 'active' as const, onHoldAt: undefined };
    });
    set({ agendas });
    await saveAgendas(agendas);
  },

  bulkDelete: async (ids: string[]) => {
    const idSet = new Set(ids);
    const agendas = get().agendas.filter((a) => !idSet.has(a.id));
    const vault = get().vault.filter((v) => !idSet.has(v.id));
    set({ agendas, vault });
    await Promise.all([saveAgendas(agendas), saveVault(vault)]);
  },

  runReflection: async () => {
    const all = get().agendas;
    const done = all.filter((a) => a.status === 'done');
    const active = all.filter((a) => a.status !== 'done');
    const reflection = await reflectDay(get().mit, done, active);
    set({ reflection });
  },

  runPulse: async (period: 'week' | 'month') => {
    const days = period === 'week' ? 7 : 30;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const source = [...get().agendas, ...get().vault].filter((a) => a.createdAt >= since);
    const result = await pulse(period === 'week' ? 'Weekly Pulse' : 'Monthly Pulse', source);
    if (period === 'week') set({ weeklyPulse: result });
    else set({ monthlyPulse: result });
  },
}));
