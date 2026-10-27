/**
 * Pure planning of local reminders — no native code, fully unit-tested.
 * Turns settings + the current prediction into a list of notifications.
 */
import type { ReminderSettings, TimeOfDay } from '../data/types';
import type { Prediction } from './cycle';
import { addDaysISO, fmt, fromISO } from './dates';

export type PlannedTrigger = { kind: 'daily'; hour: number; minute: number } | { kind: 'date'; date: Date };

export type PlannedReminder = {
  id: string;
  title: string;
  body: string;
  /** Route opened when the notification is tapped. */
  url: string;
  trigger: PlannedTrigger;
};

function at(iso: string, t: TimeOfDay) {
  const d = fromISO(iso);
  d.setHours(t.hour, t.minute, 0, 0);
  return d;
}

export const DISCREET = {
  title: 'Luna',
  period: 'A gentle reminder to check in 🌙',
  fertile: 'Time for a quick check-in ✨',
  daily: 'How are you today? Tap to check in.',
  pill: 'Your daily reminder',
};

export function planReminders(r: ReminderSettings, p: Prediction, now: Date, avgCycle: number): PlannedReminder[] {
  const out: PlannedReminder[] = [];
  const d = r.discreet;

  if (r.dailyLog.enabled) {
    out.push({
      id: 'daily-log',
      title: d ? DISCREET.title : 'How are you feeling today?',
      body: d ? DISCREET.daily : 'Log your symptoms and mood — it takes about 10 seconds.',
      url: '/log/today',
      trigger: { kind: 'daily', ...r.dailyLog.time },
    });
  }

  if (r.pill.enabled) {
    out.push({
      id: 'pill',
      title: d ? DISCREET.title : 'Pill reminder',
      body: d ? DISCREET.pill : 'Time to take your pill.',
      url: '/',
      trigger: { kind: 'daily', ...r.pill.time },
    });
  }

  if (p.nextStart) {
    // The upcoming period and the one after it, so a reminder exists even if the app isn't opened for a while.
    const starts = [p.nextStart, addDaysISO(p.nextStart, avgCycle)];

    if (r.periodSoon.enabled) {
      starts.forEach((start, i) => {
        const date = at(addDaysISO(start, -r.periodSoon.daysBefore), r.periodSoon.time);
        if (date <= now) return;
        const n = r.periodSoon.daysBefore;
        out.push({
          id: `period-${i}`,
          title: d ? DISCREET.title : `Period expected in ${n} day${n > 1 ? 's' : ''}`,
          body: d ? DISCREET.period : `Based on your cycle it may start around ${fmt(start, 'MMM d')}. Estimate only.`,
          url: '/',
          trigger: { kind: 'date', date },
        });
      });
    }

    if (r.fertile.enabled) {
      starts.forEach((start, i) => {
        const date = at(addDaysISO(start, -14 - 5), r.fertile.time);
        if (date <= now) return;
        out.push({
          id: `fertile-${i}`,
          title: d ? DISCREET.title : 'Fertile window starts today',
          body: d ? DISCREET.fertile : 'Estimated from your cycle — not for contraception.',
          url: '/',
          trigger: { kind: 'date', date },
        });
      });
    }
  }

  return out;
}

export const timeLabel = (t: TimeOfDay) => {
  const h12 = t.hour % 12 === 0 ? 12 : t.hour % 12;
  return `${h12}:${String(t.minute).padStart(2, '0')} ${t.hour < 12 ? 'AM' : 'PM'}`;
};
