/**
 * Cycle math — pure functions, no React, fully unit-tested.
 * v1 uses simple statistics (mean + spread of recent cycles). No ML.
 * Estimates only: never to be used as contraception.
 */
import type { DayLog, Settings } from '../data/types';
import { addDaysISO, diffDays, ISODate } from './dates';

export const MIN_CYCLE = 15;
export const MAX_CYCLE = 60;
const RECENT = 6;

export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
export type DayKind = 'period' | 'predictedPeriod' | 'ovulation' | 'fertile';
export type Confidence = 'low' | 'medium' | 'high';

export type PeriodRun = { start: ISODate; end: ISODate; length: number };
export type CycleRecord = { start: ISODate; length: number; periodLength: number };

export type Prediction = {
  hasData: boolean;
  lastStart: ISODate | null;
  cycleDay: number | null;
  avgCycle: number;
  avgPeriod: number;
  spread: number;
  nextStart: ISODate | null;
  nextRange: [ISODate, ISODate] | null;
  daysUntilNext: number | null;
  daysLate: number;
  ovulation: ISODate | null;
  fertile: [ISODate, ISODate] | null;
  phase: Phase | null;
  confidence: Confidence;
  cyclesLogged: number;
};

/** Group logged period days into runs. A single missing day inside a period is tolerated. */
export function periodRuns(logs: Record<string, DayLog>): PeriodRun[] {
  const days = Object.values(logs)
    .filter((l) => l.period)
    .map((l) => l.date)
    .sort();
  const runs: PeriodRun[] = [];
  for (const d of days) {
    const last = runs[runs.length - 1];
    if (last && diffDays(d, last.end) <= 2) {
      last.end = d;
      last.length = diffDays(d, last.start) + 1;
    } else {
      runs.push({ start: d, end: d, length: 1 });
    }
  }
  return runs;
}

export function cycleHistory(runs: PeriodRun[]): CycleRecord[] {
  const out: CycleRecord[] = [];
  for (let i = 0; i < runs.length - 1; i++) {
    const length = diffDays(runs[i + 1].start, runs[i].start);
    out.push({ start: runs[i].start, length, periodLength: runs[i].length });
  }
  return out;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};

export function cycleStats(logs: Record<string, DayLog>, settings: Settings) {
  const runs = periodRuns(logs);
  const history = cycleHistory(runs);
  const valid = history.filter((c) => c.length >= MIN_CYCLE && c.length <= MAX_CYCLE).slice(-RECENT);
  const lengths = valid.map((c) => c.length);
  // Completed periods only (exclude a possibly ongoing last run).
  const periodLens = runs.slice(-RECENT - 1, -1).map((r) => r.length).filter((n) => n >= 1 && n <= 12);

  const avgCycle = lengths.length ? Math.round(mean(lengths)) : settings.cycleLength;
  const avgPeriod = periodLens.length ? Math.round(mean(periodLens)) : settings.periodLength;
  const spread = lengths.length >= 2 ? sd(lengths) : 0;
  return { runs, history, valid, avgCycle, avgPeriod, spread };
}

function confidenceFor(n: number, spread: number): Confidence {
  if (n >= 5 && spread <= 2) return 'high';
  if (n >= 2 && spread <= 4) return 'medium';
  return 'low';
}

export function phaseFor(cycleDay: number, avgCycle: number, avgPeriod: number): Phase {
  const ovDay = avgCycle - 14 + 1; // cycle day of ovulation
  if (cycleDay <= avgPeriod) return 'menstrual';
  if (Math.abs(cycleDay - ovDay) <= 1) return 'ovulation';
  if (cycleDay < ovDay) return 'follicular';
  return 'luteal';
}

export function predict(logs: Record<string, DayLog>, settings: Settings, today: ISODate): Prediction {
  const { runs, valid, avgCycle, avgPeriod, spread } = cycleStats(logs, settings);
  const past = runs.filter((r) => r.start <= today);
  const last = past[past.length - 1];
  const confidence = confidenceFor(valid.length, spread);

  if (!last) {
    return {
      hasData: false, lastStart: null, cycleDay: null, avgCycle, avgPeriod, spread,
      nextStart: null, nextRange: null, daysUntilNext: null, daysLate: 0,
      ovulation: null, fertile: null, phase: null, confidence: 'low', cyclesLogged: 0,
    };
  }

  const cycleDay = diffDays(today, last.start) + 1;
  const nextStart = addDaysISO(last.start, avgCycle);
  const half = valid.length < 2 ? 2 : Math.min(4, Math.max(1, Math.round(spread)));
  const nextRange: [ISODate, ISODate] = [addDaysISO(nextStart, -half), addDaysISO(nextStart, half)];
  const daysUntilNext = diffDays(nextStart, today);
  const daysLate = Math.max(0, diffDays(today, nextRange[1]));
  const ovulation = addDaysISO(nextStart, -14);
  const fertile: [ISODate, ISODate] = [addDaysISO(ovulation, -5), addDaysISO(ovulation, 1)];

  return {
    hasData: true,
    lastStart: last.start,
    cycleDay,
    avgCycle,
    avgPeriod,
    spread,
    nextStart,
    nextRange,
    daysUntilNext,
    daysLate,
    ovulation,
    fertile,
    phase: phaseFor(cycleDay, avgCycle, avgPeriod),
    confidence,
    cyclesLogged: valid.length,
  };
}

/**
 * Map of date → kind for the calendar/strip, covering the current cycle
 * plus `ahead` projected cycles. Logged period days always win.
 */
export function dayKinds(
  logs: Record<string, DayLog>,
  settings: Settings,
  today: ISODate,
  ahead = 6
): Record<ISODate, DayKind> {
  const map: Record<ISODate, DayKind> = {};
  const p = predict(logs, settings, today);
  if (p.hasData && p.lastStart) {
    // Fertile window + ovulation for the current cycle and projections
    for (let k = 0; k <= ahead; k++) {
      const start = addDaysISO(p.lastStart, p.avgCycle * (k + 1));
      const ov = addDaysISO(start, -14);
      for (let d = -5; d <= 1; d++) map[addDaysISO(ov, d)] = d === 0 ? 'ovulation' : 'fertile';
      // Predicted period days (skip the current cycle's start if it has already been logged)
      for (let d = 0; d < p.avgPeriod; d++) {
        const day = addDaysISO(start, d);
        if (day > today || k > 0) map[day] = 'predictedPeriod';
      }
    }
    // Also the fertile window of the cycle we're in, if it hasn't passed (covered by k=0 above).
  }
  for (const l of Object.values(logs)) if (l.period) map[l.date] = 'period';
  return map;
}

export type SymptomStat = { id: string; count: number; share: number; typicalOffset: number | null };

/**
 * Top symptoms with share of logged days, and the typical day offset relative
 * to the next period start (negative = before period), when consistent.
 */
export function symptomStats(logs: Record<string, DayLog>): SymptomStat[] {
  const runs = periodRuns(logs);
  const starts = runs.map((r) => r.start);
  const logged = Object.values(logs).filter((l) => l.symptoms.length > 0);
  if (!logged.length) return [];
  const counts = new Map<string, number>();
  const offsets = new Map<string, number[]>();
  for (const l of logged) {
    const nextStart = starts.find((s) => s >= l.date);
    for (const s of l.symptoms) {
      counts.set(s, (counts.get(s) ?? 0) + 1);
      if (nextStart) {
        const off = diffDays(l.date, nextStart);
        if (off >= -7 && off <= 0) offsets.set(s, [...(offsets.get(s) ?? []), off]);
      }
    }
  }
  return [...counts.entries()]
    .map(([id, count]) => {
      const offs = offsets.get(id) ?? [];
      let typicalOffset: number | null = null;
      if (offs.length >= 2) {
        const freq = new Map<number, number>();
        offs.forEach((o) => freq.set(o, (freq.get(o) ?? 0) + 1));
        const [best, n] = [...freq.entries()].sort((a, b) => b[1] - a[1])[0];
        if (n >= 2) typicalOffset = best;
      }
      return { id, count, share: count / logged.length, typicalOffset };
    })
    .sort((a, b) => b.count - a.count);
}

/** Gentle irregularity flag based on common clinical ranges. Not a diagnosis. */
export function irregularity(lengths: number[]): string | null {
  if (lengths.length < 3) return null;
  const avg = mean(lengths);
  const range = Math.max(...lengths) - Math.min(...lengths);
  if (avg < 21) return 'Your cycles are often shorter than 21 days.';
  if (avg > 35) return 'Your cycles are often longer than 35 days.';
  if (range > 9) return `Your cycle length varies by ${range} days.`;
  return null;
}

/** Seed logs for onboarding: the last period with the typical period length. */
export function seedPeriod(start: ISODate, length: number, today: ISODate): DayLog[] {
  const out: DayLog[] = [];
  for (let i = 0; i < length; i++) {
    const date = addDaysISO(start, i);
    if (date > today) break;
    out.push({ date, period: true, symptoms: [], moods: [] });
  }
  return out;
}
