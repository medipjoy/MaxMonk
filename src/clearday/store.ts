import { create } from 'zustand';
import { EXPIRY_DAYS, isCenterPoint, posFromSliders, qFromPos, uid } from './helpers';
import { runMigrationIfNeeded } from './migration';
import {
  loadAgendas,
  loadConfig,
  loadTodayMit,
  loadVault,
  saveAgendas,
  saveConfig,
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
  Quadrant,
  QUADRANT_LABEL_MAX_LENGTH,
  TAG_MAX_LENGTH,
  ThemeMode,
  VaultEntry,
} from './types';

interface ClearDayState {
  ready: boolean;
  agendas: Agenda[];
  vault: VaultEntry[];
  mit: string;
  config: AppConfig;

  bootstrap: () => Promise<void>;
  setName: (name: string) => Promise<void>;
  setThemeMode: (themeMode: ThemeMode) => Promise<void>;
  setVaultExpiryDefault: (value: ExpiryDefault) => Promise<void>;
  setHoldExpiryDefault: (value: ExpiryDefault) => Promise<void>;
  setTags: (tags: string[]) => Promise<void>;
  setQuadrantLabel: (quadrant: Quadrant, label: string) => Promise<boolean>;
  setQuadrantLabels: (labels: Record<Quadrant, string>) => Promise<void>;
  addTag: (tag: string) => Promise<boolean>;
  removeTag: (tag: string) => Promise<boolean>;
  renameTag: (oldTag: string, newTag: string) => Promise<boolean>;
  setMit: (mit: string) => Promise<void>;
  setVaultRetentionDays: (days: number) => Promise<void>;
  setMatrixStyle: (style: AppConfig['matrixStyle']) => Promise<void>;
  setFontChoice: (font: AppConfig['fontChoice']) => Promise<void>;
  setMitResetHour: (hour: number) => Promise<void>;
  setFontSizeMultiplier: (multiplier: number) => Promise<void>;

  addAgenda: (input: {
    text: string;
    domain: AgendaDomain;
    time: AgendaTime;
    urgency: number;
    importance: number;
  }) => Promise<Agenda | null>;

  updateAgendaPosition: (id: string, cx: number, cy: number) => Promise<void>;
  completeAgenda: (id: string) => Promise<void>;
  restoreCompletedAgenda: (id: string) => Promise<void>;
  toggleHold: (id: string) => Promise<void>;
  setAgendaMit: (id: string) => Promise<void>;
  updateAgenda: (id: string, patch: Partial<Pick<Agenda, 'text' | 'domain' | 'time' | 'cx' | 'cy'>>) => Promise<void>;

  archiveAgenda: (id: string) => Promise<void>;
  restoreVaultAgenda: (id: string) => Promise<void>;
  restoreVaultToActive: (id: string) => Promise<void>;
  deleteVaultAgenda: (id: string) => Promise<void>;

  bulkArchiveToVault: (ids: string[]) => Promise<void>;
  bulkHold: (ids: string[]) => Promise<void>;
  bulkResume: (ids: string[]) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  reorderActiveAgenda: (id: string, targetQuadrant: Quadrant, nextIndex: number) => Promise<void>;
  reorderHoldAgenda: (id: string, nextIndex: number) => Promise<void>;
}

async function persistSnapshot(state: Pick<ClearDayState, 'agendas' | 'vault'>): Promise<void> {
  await Promise.all([saveAgendas(state.agendas), saveVault(state.vault)]);
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

function applyVaultRetentionPolicy(vault: VaultEntry[], retentionDays: number): VaultEntry[] {
  if (retentionDays <= 0) return vault; // 0 = never auto-delete
  return vault.filter((e) => expiryDaysPassed(e.archivedAt) < retentionDays);
}

function capFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function normalizeTagList(input: string[]): string[] {
  const next: string[] = [];
  input.forEach((tag) => {
    const raw = tag.trim();
    if (!raw) return;
    const clean = capFirst(raw.slice(0, TAG_MAX_LENGTH));
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
  // Legacy: full-word tags stored before 3-char migration — try truncated match
  const truncated = capFirst(value.trim().slice(0, TAG_MAX_LENGTH));
  const foundTrunc = tags.find((t) => t.toLowerCase() === truncated.toLowerCase());
  if (foundTrunc) return foundTrunc;
  return tags[0];
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function sortByListOrder(items: Agenda[]): Agenda[] {
  return [...items].sort((a, b) => {
    const aOrder = a.listOrder ?? 0;
    const bOrder = b.listOrder ?? 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.createdAt - b.createdAt;
  });
}

function assignOrders(items: Agenda[]): Agenda[] {
  return items.map((agenda, index) => ({ ...agenda, listOrder: index }));
}

function normalizeAgendaOrders(agendas: Agenda[]): Agenda[] {
  const next = [...agendas];
  const updateGroup = (matcher: (agenda: Agenda) => boolean) => {
    const indexes = next
      .map((agenda, index) => ({ agenda, index }))
      .filter(({ agenda }) => matcher(agenda));
    const sorted = assignOrders(sortByListOrder(indexes.map(({ agenda }) => agenda)));
    sorted.forEach((agenda, localIndex) => {
      next[indexes[localIndex].index] = agenda;
    });
  };

  (['Q1', 'Q2', 'Q3', 'Q4'] as Quadrant[]).forEach((quadrant) => {
    updateGroup((agenda) => agenda.status === 'active' && agenda.quadrant === quadrant);
  });
  updateGroup((agenda) => agenda.status === 'onhold');
  updateGroup((agenda) => agenda.status === 'done');
  return next;
}

function nextOrderForGroup(agendas: Agenda[], matcher: (agenda: Agenda) => boolean): number {
  const orders = agendas.filter(matcher).map((agenda) => agenda.listOrder ?? 0);
  if (orders.length === 0) return 0;
  return Math.min(...orders) - 1;
}

function reorderAgendas(
  agendas: Agenda[],
  matcher: (agenda: Agenda) => boolean,
  id: string,
  nextIndex: number,
): Agenda[] {
  const scoped = sortByListOrder(agendas.filter(matcher));
  const currentIndex = scoped.findIndex((agenda) => agenda.id === id);
  if (currentIndex < 0) return agendas;
  const targetIndex = clamp(nextIndex, 0, scoped.length - 1);
  if (targetIndex === currentIndex) return agendas;

  const reordered = [...scoped];
  const [moved] = reordered.splice(currentIndex, 1);
  reordered.splice(targetIndex, 0, moved);
  const reassigned = assignOrders(reordered);
  const byId = new Map(reassigned.map((agenda) => [agenda.id, agenda]));
  return agendas.map((agenda) => byId.get(agenda.id) ?? agenda);
}

function quadrantAnchorPos(quadrant: Quadrant): { cx: number; cy: number } {
  if (quadrant === 'Q1') return posFromSliders(75, 75);
  if (quadrant === 'Q2') return posFromSliders(25, 75);
  if (quadrant === 'Q3') return posFromSliders(75, 25);
  return posFromSliders(25, 25);
}

export const useClearDayStore = create<ClearDayState>((set, get) => ({
  ready: false,
  agendas: [],
  vault: [],
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
    vaultRetentionDays: 0,
  },

  bootstrap: async () => {
    await runMigrationIfNeeded();
    const [loadedAgendas, loadedVault, mit, rawConfig] = await Promise.all([
      loadAgendas(),
      loadVault(),
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
      vaultRetentionDays: rawConfig.vaultRetentionDays ?? 0,
    };
    const normalizedAgendas = normalizeAgendaOrders(loadedAgendas.map((a) => ({ ...a, domain: resolveTag(a.domain, tags) })));
    const normalizedVault = loadedVault.map((v) => ({ ...v, domain: resolveTag(v.domain, tags) }));
    const holdPolicy = applyHoldExpiryPolicy(normalizedAgendas, config.holdExpiryDefault);
    const agendas = holdPolicy.agendas;
    const vault = applyVaultRetentionPolicy([...holdPolicy.vault, ...normalizedVault], config.vaultRetentionDays);

    set({ agendas, vault, mit, config, ready: true });

    const tagsChanged = JSON.stringify(rawConfig.tags ?? []) !== JSON.stringify(tags);
    const orderChanged = loadedAgendas.some((agenda, index) => agenda.listOrder !== normalizedAgendas[index]?.listOrder);
    const vaultChanged = vault.length !== [...holdPolicy.vault, ...normalizedVault].length;
    if (holdPolicy.vault.length > 0 || tagsChanged || vaultChanged || orderChanged) {
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

  setQuadrantLabels: async (labels: Record<Quadrant, string>) => {
    const nextCfg = {
      ...get().config,
      quadrantLabels: normalizeQuadrantLabels(labels),
    };
    set({ config: nextCfg });
    await saveConfig(nextCfg);
  },

  addTag: async (tag: string) => {
    const clean = capFirst(tag.trim().slice(0, TAG_MAX_LENGTH));
    if (!clean) return false;
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
    const newClean = capFirst(newTag.trim().slice(0, TAG_MAX_LENGTH));
    if (!oldClean || !newClean) return false;
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
      listOrder: nextOrderForGroup(get().agendas, (item) => item.status === 'active' && item.quadrant === qFromPos(cx, cy)),
      createdAt: Date.now(),
    };
    const agendas = [agenda, ...get().agendas];
    set({ agendas });
    await saveAgendas(agendas);
    return agenda;
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
    const agendas = get().agendas.map((a) => {
      if (a.id !== id) return a;
      return {
        ...a,
        status: 'done' as const,
        doneAt: Date.now(),
        onHoldAt: undefined,
        listOrder: nextOrderForGroup(get().agendas, (item) => item.status === 'done'),
      };
    });
    set({ agendas });
    await saveAgendas(agendas);
  },

  restoreCompletedAgenda: async (id: string) => {
    const agendas = get().agendas.map((a) => {
      if (a.id !== id || a.status !== 'done') return a;
      return {
        ...a,
        status: 'active' as const,
        doneAt: undefined,
        listOrder: nextOrderForGroup(get().agendas, (item) => item.status === 'active' && item.quadrant === a.quadrant),
      };
    });
    set({ agendas });
    await saveAgendas(agendas);
  },

  toggleHold: async (id: string) => {
    const holdExpiryOn = get().config.holdExpiryDefault === 'on_60d';
    const agendas = get().agendas.map((a) => {
      if (a.id !== id) return a;
      if (a.status === 'onhold') {
        return {
          ...a,
          status: 'active' as const,
          onHoldAt: undefined,
          listOrder: nextOrderForGroup(get().agendas, (item) => item.status === 'active' && item.quadrant === a.quadrant),
        };
      }
      return {
        ...a,
        status: 'onhold' as const,
        onHoldAt: holdExpiryOn ? Date.now() : undefined,
        listOrder: nextOrderForGroup(get().agendas, (item) => item.status === 'onhold'),
      };
    });
    set({ agendas });
    await saveAgendas(agendas);
  },

  reorderActiveAgenda: async (id: string, targetQuadrant: Quadrant, nextIndex: number) => {
    const agenda = get().agendas.find((item) => item.id === id);
    if (!agenda || agenda.status !== 'active') return;
    const all = get().agendas;
    const targetGroup = sortByListOrder(all.filter((item) => item.status === 'active' && item.quadrant === targetQuadrant && item.id !== id));
    const targetIndex = clamp(nextIndex, 0, targetGroup.length);
    const movingAgenda = targetQuadrant === agenda.quadrant
      ? { ...agenda }
      : { ...agenda, quadrant: targetQuadrant, ...quadrantAnchorPos(targetQuadrant) };

    const reorderedTarget = [...targetGroup];
    reorderedTarget.splice(targetIndex, 0, movingAgenda);
    const targetWithOrders = assignOrders(reorderedTarget);
    const targetMap = new Map(targetWithOrders.map((item) => [item.id, item]));

    const agendas = all.map((item) => {
      if (item.id === id) return targetMap.get(id) ?? movingAgenda;
      if (item.status === 'active' && item.quadrant === targetQuadrant) {
        return targetMap.get(item.id) ?? item;
      }
      return item;
    });
    set({ agendas });
    await saveAgendas(agendas);
  },

  reorderHoldAgenda: async (id: string, nextIndex: number) => {
    const agendas = reorderAgendas(get().agendas, (item) => item.status === 'onhold', id, nextIndex);
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
    await persistSnapshot({ agendas, vault });
  },

  restoreVaultAgenda: async (id: string) => {
    const entry = get().vault.find((v) => v.id === id);
    if (!entry) return;
    const vault = get().vault.filter((v) => v.id !== id);
    const { archivedAt, ...agenda } = entry;
    const agendas = [{
      ...agenda,
      status: 'onhold' as const,
      onHoldAt: undefined,
      doneAt: undefined,
      listOrder: nextOrderForGroup(get().agendas, (item) => item.status === 'onhold'),
    }, ...get().agendas];
    set({ agendas, vault });
    await persistSnapshot({ agendas, vault });
  },

  restoreVaultToActive: async (id: string) => {
    const entry = get().vault.find((v) => v.id === id);
    if (!entry) return;
    const vault = get().vault.filter((v) => v.id !== id);
    const { archivedAt, ...agenda } = entry;
    const agendas = [{
      ...agenda,
      status: 'active' as const,
      onHoldAt: undefined,
      doneAt: undefined,
      listOrder: nextOrderForGroup(get().agendas, (item) => item.status === 'active' && item.quadrant === agenda.quadrant),
    }, ...get().agendas];
    set({ agendas, vault });
    await persistSnapshot({ agendas, vault });
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
    await persistSnapshot({ agendas, vault });
  },

  bulkHold: async (ids: string[]) => {
    const idSet = new Set(ids);
    const holdExpiryOn = get().config.holdExpiryDefault === 'on_60d';
    const agendas = get().agendas.map((a) => {
      if (!idSet.has(a.id) || a.status === 'done') return a;
      return {
        ...a,
        status: 'onhold' as const,
        onHoldAt: holdExpiryOn ? Date.now() : undefined,
        listOrder: nextOrderForGroup(get().agendas, (item) => item.status === 'onhold'),
      };
    });
    set({ agendas });
    await saveAgendas(agendas);
  },

  bulkResume: async (ids: string[]) => {
    const idSet = new Set(ids);
    const agendas = get().agendas.map((a) => {
      if (!idSet.has(a.id) || a.status !== 'onhold') return a;
      return {
        ...a,
        status: 'active' as const,
        onHoldAt: undefined,
        listOrder: nextOrderForGroup(get().agendas, (item) => item.status === 'active' && item.quadrant === a.quadrant),
      };
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

  setVaultRetentionDays: async (days: number) => {
    const next = { ...get().config, vaultRetentionDays: days };
    set({ config: next });
    await saveConfig(next);
  },

  setMatrixStyle: async (style) => {
    const next = { ...get().config, matrixStyle: style };
    set({ config: next });
    await saveConfig(next);
  },

  setFontChoice: async (font) => {
    const next = { ...get().config, fontChoice: font };
    set({ config: next });
    await saveConfig(next);
  },

  setMitResetHour: async (hour) => {
    const next = { ...get().config, mitResetHour: hour };
    set({ config: next });
    await saveConfig(next);
  },

  setFontSizeMultiplier: async (multiplier) => {
    const next = { ...get().config, fontSizeMultiplier: multiplier };
    set({ config: next });
    await saveConfig(next);
  },
}));
