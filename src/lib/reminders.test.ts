import { describe, expect, it } from '@jest/globals';
import { defaultReminders, defaultSettings, DayLog, ReminderSettings } from '../data/types';
import { predict } from './cycle';
import { addDaysISO } from './dates';
import { lockoutMs } from './pin';
import { DISCREET, planReminders, timeLabel } from './reminderPlan';

function periodFrom(start: string, len = 5): Record<string, DayLog> {
  const logs: Record<string, DayLog> = {};
  for (let i = 0; i < len; i++) {
    const d = addDaysISO(start, i);
    logs[d] = { date: d, period: true, symptoms: [], moods: [] };
  }
  return logs;
}

const settings = { ...defaultSettings, onboarded: true };
const p = predict(periodFrom('2026-10-01'), settings, '2026-10-12'); // next start 2026-10-29
const now = new Date(2026, 9, 12, 12, 0);

const on = (patch: Partial<ReminderSettings>): ReminderSettings => ({ ...defaultReminders, ...patch });

describe('planReminders', () => {
  it('plans nothing when every reminder is off', () => {
    expect(planReminders(defaultReminders, p, now, 28)).toEqual([]);
  });

  it('schedules the period reminder N days before at the chosen time, for the next two cycles', () => {
    const plan = planReminders(on({ discreet: false, periodSoon: { enabled: true, daysBefore: 2, time: { hour: 9, minute: 30 } } }), p, now, 28);
    expect(plan.map((r) => r.id)).toEqual(['period-0', 'period-1']);
    const t = plan[0].trigger;
    expect(t.kind).toBe('date');
    if (t.kind === 'date') {
      expect(t.date.getFullYear()).toBe(2026);
      expect(t.date.getMonth()).toBe(9);
      expect(t.date.getDate()).toBe(27);
      expect(t.date.getHours()).toBe(9);
      expect(t.date.getMinutes()).toBe(30);
    }
    expect(plan[0].title).toBe('Period expected in 2 days');
  });

  it('uses generic wording in discreet mode', () => {
    const plan = planReminders(on({ periodSoon: { ...defaultReminders.periodSoon, enabled: true } }), p, now, 28);
    expect(plan[0].title).toBe(DISCREET.title);
    expect(plan[0].body).not.toMatch(/period|cycle|fertile/i);
  });

  it('skips reminders whose time has already passed', () => {
    const late = new Date(2026, 9, 28, 12, 0); // after the first reminder
    const plan = planReminders(on({ periodSoon: { ...defaultReminders.periodSoon, enabled: true } }), p, late, 28);
    expect(plan.map((r) => r.id)).toEqual(['period-1']);
  });

  it('daily reminders repeat at the set time', () => {
    const plan = planReminders(on({ dailyLog: { enabled: true, time: { hour: 20, minute: 30 } } }), p, now, 28);
    expect(plan[0]).toMatchObject({ id: 'daily-log', url: '/log/today', trigger: { kind: 'daily', hour: 20, minute: 30 } });
  });

  it('fertile window reminder lands on the first estimated fertile day', () => {
    const plan = planReminders(on({ fertile: { enabled: true, time: { hour: 8, minute: 0 } } }), p, new Date(2026, 9, 1), 28);
    const t = plan[0].trigger;
    if (t.kind === 'date') expect(t.date.getDate()).toBe(10); // next start 29th − 19
  });
});

describe('PIN lockout policy', () => {
  it('allows 4 misses, then 30s doubling, capped at 15 min', () => {
    expect(lockoutMs(4)).toBe(0);
    expect(lockoutMs(5)).toBe(30_000);
    expect(lockoutMs(6)).toBe(60_000);
    expect(lockoutMs(20)).toBe(15 * 60_000);
  });
});

describe('timeLabel', () => {
  it('formats 12-hour time', () => {
    expect(timeLabel({ hour: 0, minute: 5 })).toBe('12:05 AM');
    expect(timeLabel({ hour: 20, minute: 30 })).toBe('8:30 PM');
  });
});
