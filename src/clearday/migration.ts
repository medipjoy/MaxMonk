import { loadConfig, getLegacyNativeTasks, getLegacyWebTasks, loadAgendas, saveAgendas, saveConfig } from './storage';
import { posFromSliders, qFromPos, uid } from './helpers';
import { Agenda, AgendaDomain, AgendaTime } from './types';

function toNumber(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function mapLegacyTask(task: any): Agenda {
  const urgency10 = toNumber(task.urgency, 5);
  const importance10 = toNumber(task.importance, 5);
  const urgency = Math.round((urgency10 / 10) * 100);
  const importance = Math.round((importance10 / 10) * 100);
  const { cx, cy } = posFromSliders(urgency, importance);
  const text = [task.title, task.description].filter(Boolean).join(': ').trim() || 'Untitled agenda';
  const domain: AgendaDomain = /work|client|deal|report|meeting/i.test(text) ? 'Professional' : 'Personal';
  const time: AgendaTime = urgency > 75 ? 'quick' : urgency > 55 ? 'short' : importance > 75 ? 'deep' : 'medium';
  const doneAt = task.completedAt ? new Date(task.completedAt).getTime() : undefined;
  return {
    id: typeof task.id === 'string' ? task.id : uid(),
    text,
    quadrant: qFromPos(cx, cy),
    domain,
    time,
    status: doneAt ? 'done' : 'active',
    cx,
    cy,
    createdAt: task.createdAt ? new Date(task.createdAt).getTime() : Date.now(),
    doneAt,
  };
}

export async function runMigrationIfNeeded(): Promise<void> {
  const cfg = await loadConfig();
  if (cfg.migratedV1) return;

  const existing = await loadAgendas();
  if (existing.length > 0) {
    await saveConfig({ ...cfg, migratedV1: true });
    return;
  }

  try {
    const web = await getLegacyWebTasks();
    const native = await getLegacyNativeTasks().catch(() => []);
    const source = web.length > 0 ? web : native;

    if (source.length > 0) {
      const migrated = source.map(mapLegacyTask);
      await saveAgendas(migrated);
    }
  } catch (err) {
    // Migration may fail on web due to SQLite not being available
    // This is OK - web users won't have legacy data anyway
  }

  await saveConfig({ ...cfg, migratedV1: true });
}
