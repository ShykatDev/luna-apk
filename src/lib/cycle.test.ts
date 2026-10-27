import { describe, expect, it } from '@jest/globals';
import { DayLog, defaultSettings, Settings } from '../data/types';
import { addDaysISO } from './dates';
import { cycleStats, dayKinds, irregularity, periodRuns, predict, seedPeriod, symptomStats } from './cycle';

const settings: Settings = { ...defaultSettings, onboarded: true, cycleLength: 28, periodLength: 5 };

function periods(starts: string[], len = 5): Record<string, DayLog> {
  const logs: Record<string, DayLog> = {};
  for (const s of starts)
    for (let i = 0; i < len; i++) {
      const date = addDaysISO(s, i);
      logs[date] = { date, period: true, symptoms: [], moods: [] };
    }
  return logs;
}

describe('periodRuns', () => {
  it('groups consecutive days and tolerates a one-day gap', () => {
    const logs = periods(['2026-01-01'], 3);
    logs['2026-01-05'] = { date: '2026-01-05', period: true, symptoms: [], moods: [] }; // gap on 01-04
    const runs = periodRuns(logs);
    expect(runs).toEqual([{ start: '2026-01-01', end: '2026-01-05', length: 5 }]);
  });
});

describe('predict', () => {
  it('returns no data when nothing is logged', () => {
    expect(predict({}, settings, '2026-03-01').hasData).toBe(false);
  });

  it('uses the typical cycle length with only one period logged', () => {
    const p = predict(periods(['2026-10-01']), settings, '2026-10-12');
    expect(p.cycleDay).toBe(12);
    expect(p.nextStart).toBe('2026-10-29');
    expect(p.nextRange).toEqual(['2026-10-27', '2026-10-31']);
    expect(p.ovulation).toBe('2026-10-15');
    expect(p.fertile).toEqual(['2026-10-10', '2026-10-16']);
    expect(p.confidence).toBe('low');
    expect(p.phase).toBe('follicular');
  });

  it('learns the average from logged cycles', () => {
    // 30-day cycles
    const logs = periods(['2026-05-01', '2026-05-31', '2026-06-30', '2026-07-30', '2026-08-29', '2026-09-28']);
    const p = predict(logs, settings, '2026-10-05');
    expect(p.avgCycle).toBe(30);
    expect(p.nextStart).toBe('2026-10-28');
    expect(p.confidence).toBe('high');
    expect(p.cyclesLogged).toBe(5);
  });

  it('reports a late period', () => {
    const p = predict(periods(['2026-09-01']), settings, '2026-10-05');
    // next 09-29, range end 10-01 → 4 days late
    expect(p.daysLate).toBe(4);
  });

  it('ignores implausible cycle lengths', () => {
    const logs = periods(['2026-01-01', '2026-01-10', '2026-02-07']); // 9 (ignored), 28
    expect(cycleStats(logs, settings).avgCycle).toBe(28);
  });
});

describe('dayKinds', () => {
  it('marks logged, predicted and fertile days', () => {
    const k = dayKinds(periods(['2026-10-01']), settings, '2026-10-12', 1);
    expect(k['2026-10-01']).toBe('period');
    expect(k['2026-10-29']).toBe('predictedPeriod');
    expect(k['2026-10-15']).toBe('ovulation');
    expect(k['2026-10-12']).toBe('fertile');
  });
});

describe('symptomStats', () => {
  it('finds the typical day before a period', () => {
    const logs = periods(['2026-07-01', '2026-07-29', '2026-08-26']);
    for (const d of ['2026-07-28', '2026-08-25']) logs[d] = { date: d, period: false, symptoms: ['cramps'], moods: [] };
    const s = symptomStats(logs);
    expect(s[0].id).toBe('cramps');
    expect(s[0].typicalOffset).toBe(-1);
  });
});

describe('irregularity', () => {
  it('flags large variation', () => {
    expect(irregularity([24, 28, 36])).toMatch(/varies by 12/);
    expect(irregularity([28, 29, 27])).toBeNull();
  });
});

describe('seedPeriod', () => {
  it('never seeds future days', () => {
    expect(seedPeriod('2026-10-25', 5, '2026-10-27')).toHaveLength(3);
  });
});
