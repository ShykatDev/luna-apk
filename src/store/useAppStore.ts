import { create } from 'zustand';
import { storage } from '../data/db';
import { DayLog, defaultSettings, emptyLog, isEmptyLog, Settings } from '../data/types';
import { seedPeriod } from '../lib/cycle';
import { clearPin } from '../lib/pin';
import { cancelAllReminders } from '../lib/reminders';
import { useLock } from './useLock';
import { todayISO } from '../lib/dates';

type State = {
  ready: boolean;
  encrypted: boolean;
  settings: Settings;
  logs: Record<string, DayLog>;
  init: () => Promise<void>;
  completeOnboarding: (p: {
    name: string;
    lastPeriodStart: string;
    cycleLength: number;
    periodLength: number;
    goal: Settings['goal'];
  }) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  saveLog: (log: DayLog) => Promise<void>;
  togglePeriod: (date: string) => Promise<boolean>;
  importLogs: (logs: DayLog[]) => Promise<void>;
  resetAll: () => Promise<void>;
};

export const useApp = create<State>((set, get) => ({
  ready: false,
  encrypted: false,
  settings: defaultSettings,
  logs: {},

  init: async () => {
    if (get().ready) return;
    await storage.open();
    const [{ settings, logs }, encrypted] = await Promise.all([storage.load(), storage.isEncrypted()]);
    set({ settings, logs, encrypted, ready: true });
  },

  completeOnboarding: async ({ name, lastPeriodStart, cycleLength, periodLength, goal }) => {
    const settings: Settings = { ...get().settings, name: name.trim(), onboarded: true, cycleLength, periodLength, goal };
    const seeded = seedPeriod(lastPeriodStart, periodLength, todayISO());
    await storage.upsertLogs(seeded);
    await storage.saveSettings(settings);
    const logs = { ...get().logs };
    for (const l of seeded) logs[l.date] = { ...(logs[l.date] ?? emptyLog(l.date)), period: true };
    set({ settings, logs });
  },

  updateSettings: async (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    await storage.saveSettings(settings);
  },

  saveLog: async (log) => {
    const logs = { ...get().logs };
    if (isEmptyLog(log)) {
      delete logs[log.date];
      set({ logs });
      await storage.deleteLog(log.date);
    } else {
      logs[log.date] = log;
      set({ logs });
      await storage.upsertLog(log);
    }
  },

  togglePeriod: async (date) => {
    const current = get().logs[date] ?? emptyLog(date);
    const next: DayLog = { ...current, period: !current.period, flow: current.period ? undefined : current.flow };
    await get().saveLog(next);
    return next.period;
  },

  importLogs: async (incoming) => {
    const logs = { ...get().logs };
    for (const l of incoming) logs[l.date] = l;
    set({ logs });
    await storage.upsertLogs(incoming);
  },

  resetAll: async () => {
    // Erase everything this app knows: logs, settings, PIN and scheduled reminders.
    await Promise.all([storage.wipe(), clearPin(), cancelAllReminders()]);
    await useLock.getState().refresh();
    set({ settings: defaultSettings, logs: {} });
  },
}));
