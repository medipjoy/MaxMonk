import { countByQuadrant, qFromPos } from './helpers';
import { Agenda, PulseInsight, SparkSuggestion } from './types';

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export async function suggestFromSpark(text: string): Promise<SparkSuggestion> {
  const h = hash(text);
  const urgency = 20 + (h % 70);
  const importance = 20 + ((h / 7) % 70);
  const quadrant = qFromPos(urgency / 100, 1 - importance / 100);
  const domain = h % 2 === 0 ? 'Professional' : 'Personal';
  const times = ['quick', 'short', 'medium', 'deep'] as const;
  const time = times[h % times.length];
  return {
    quadrant,
    domain,
    time,
    urgency: Math.round(urgency),
    importance: Math.round(importance),
    refined: text.trim().replace(/\s+/g, ' '),
  };
}

export async function reflectDay(mit: string, done: Agenda[], active: Agenda[]): Promise<string> {
  const win = done.length > 0
    ? `You completed ${done.length} agenda${done.length > 1 ? 's' : ''} today.`
    : 'You stayed in the game even if today felt heavy.';
  const mitLine = mit ? `Your MIT was “${mit}”, and you kept it visible.` : 'Set a sharper MIT tomorrow to anchor your focus.';
  const nudge = active.length > 0
    ? `Tomorrow, start with one ${active[0].quadrant} agenda before opening anything else.`
    : 'Tomorrow, place one meaningful agenda on the matrix first thing.';
  return `${win} ${mitLine} Your quadrant balance is becoming clearer. ${nudge}`;
}

export async function pulse(title: string, agendas: Agenda[]): Promise<PulseInsight> {
  const counts = countByQuadrant(agendas);
  const total = agendas.length || 1;
  const pct = (n: number) => Math.round((n / total) * 100);
  return {
    title,
    lines: [
      `1. ${pct(counts.Q2)}% of your agendas were in Q2 (Schedule), which reflects proactive planning momentum.`,
      `2. ${pct(counts.Q1)}% landed in Q1; lowering this over time should reduce reactive work.`,
      `3. Keep Q3/Q4 intentional (${pct(counts.Q3)}% / ${pct(counts.Q4)}%) so delegated and low-value tasks do not crowd your MIT.`,
    ],
  };
}
