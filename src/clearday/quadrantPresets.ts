import { Quadrant } from './types';

export type QuadrantLabelSet = Record<Quadrant, string>;

export const QUADRANT_PRESETS: QuadrantLabelSet[] = [
  { Q1: 'Do Now', Q2: 'Schedule', Q3: 'Delegate', Q4: 'Eliminate' },
  { Q1: 'Crisis', Q2: 'Strategic', Q3: 'Handoff', Q4: 'Drop' },
  { Q1: 'Deadline', Q2: 'Vision', Q3: 'Partner', Q4: 'Distraction' },
  { Q1: 'Urgent', Q2: 'Family Time', Q3: 'Help', Q4: 'Screen Time' },
  { Q1: 'Revise Now', Q2: 'Design', Q3: 'Review', Q4: 'Archive' },
  { Q1: 'Client Now', Q2: 'Strategic', Q3: 'Team', Q4: 'Admin' },
  { Q1: 'Write Now', Q2: 'Plan', Q3: 'Edit', Q4: 'Draft Bank' },
];

export function getQuadrantPresetIndex(labels: QuadrantLabelSet): number {
  return QUADRANT_PRESETS.findIndex((preset) =>
    preset.Q1 === labels.Q1 &&
    preset.Q2 === labels.Q2 &&
    preset.Q3 === labels.Q3 &&
    preset.Q4 === labels.Q4
  );
}

export function formatQuadrantPresetSummary(labels: QuadrantLabelSet): string {
  return `${labels.Q1} · ${labels.Q2} · ${labels.Q3} · ${labels.Q4}`;
}
