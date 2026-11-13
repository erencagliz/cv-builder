import type { CV, DateRange } from '../model/types';

export type Level = 'ok' | 'warn' | 'error' | 'info';
export interface Check {
  id: string;
  level: Level;
  title: string;
  detail?: string;
  target?: string;
}

const ym = (v: string) => {
  const m = /^(\d{4})(?:-(\d{2}))?/.exec(v || '');
  return m ? parseInt(m[1], 10) * 12 + (m[2] ? parseInt(m[2], 10) - 1 : 0) : null;
};
const nowYm = () => {
  const d = new Date();
  return d.getFullYear() * 12 + d.getMonth();
};

export function totalExperienceMonths(cv: CV): number {
  const spans = cv.sections.experience
    .map((e) => e.dates as DateRange | undefined)
    .filter((d): d is DateRange => !!d && !!ym(d.start))
    .map((d) => [ym(d.start)!, d.current ? nowYm() : ym(d.end) ?? ym(d.start)!] as [number, number])
    .filter(([a, b]) => b >= a)
    .sort((a, b) => a[0] - b[0]);
  let total = 0;
  let cur: [number, number] | null = null;
  for (const sp of spans) {
    if (!cur || sp[0] > cur[1]) {
      if (cur) total += cur[1] - cur[0] + 1;
      cur = [...sp];
    } else cur[1] = Math.max(cur[1], sp[1]);
  }
  if (cur) total += cur[1] - cur[0] + 1;
  return total;
}
