export type Flow = 'light' | 'medium' | 'heavy';
export type Energy = 'low' | 'medium' | 'high';

/** One row per calendar day (ISO yyyy-MM-dd, local time). */
export type DayLog = {
  date: string;
  period: boolean;
  flow?: Flow;
  symptoms: string[];
  moods: string[];
  energy?: Energy;
  notes?: string;
};

export type TimeOfDay = { hour: number; minute: number };

export type LockSettings = {
  enabled: boolean;
  biometrics: boolean;
  /** Seconds in background before the app locks again (0 = immediately). */
  autoLockAfter: 0 | 60 | 300;
  /** Cover the screen in the app switcher. */
  hideInSwitcher: boolean;
};

export type ReminderSettings = {
  /** Generic wording ("Time to check in") so nothing sensitive shows on the lock screen. */
  discreet: boolean;
  periodSoon: { enabled: boolean; daysBefore: 1 | 2 | 3; time: TimeOfDay };
  fertile: { enabled: boolean; time: TimeOfDay };
  dailyLog: { enabled: boolean; time: TimeOfDay };
  pill: { enabled: boolean; time: TimeOfDay };
};

export type Settings = {
  onboarded: boolean;
  /** What the user wants to be called. Stays on device. */
  name: string;
  /** User-entered typical lengths, used until enough cycles are logged. */
  cycleLength: number;
  periodLength: number;
  goal: 'period' | 'symptoms';
  lock: LockSettings;
  reminders: ReminderSettings;
};

export const defaultLock: LockSettings = { enabled: false, biometrics: false, autoLockAfter: 60, hideInSwitcher: true };

export const defaultReminders: ReminderSettings = {
  discreet: true,
  periodSoon: { enabled: false, daysBefore: 2, time: { hour: 9, minute: 0 } },
  fertile: { enabled: false, time: { hour: 9, minute: 0 } },
  dailyLog: { enabled: false, time: { hour: 20, minute: 30 } },
  pill: { enabled: false, time: { hour: 21, minute: 0 } },
};

export const defaultSettings: Settings = {
  onboarded: false,
  name: '',
  cycleLength: 28,
  periodLength: 5,
  goal: 'period',
  lock: defaultLock,
  reminders: defaultReminders,
};

/** Fill in fields added in newer versions so older saved settings keep working. */
export function withDefaults(s: Partial<Settings> | undefined): Settings {
  const r = s?.reminders ?? ({} as Partial<ReminderSettings>);
  return {
    ...defaultSettings,
    ...s,
    lock: { ...defaultLock, ...s?.lock },
    reminders: {
      ...defaultReminders,
      ...r,
      periodSoon: { ...defaultReminders.periodSoon, ...r.periodSoon },
      fertile: { ...defaultReminders.fertile, ...r.fertile },
      dailyLog: { ...defaultReminders.dailyLog, ...r.dailyLog },
      pill: { ...defaultReminders.pill, ...r.pill },
    },
  };
}

export type Snapshot = { settings: Settings; logs: Record<string, DayLog> };

export interface Storage {
  open(): Promise<void>;
  load(): Promise<Snapshot>;
  saveSettings(s: Settings): Promise<void>;
  upsertLog(log: DayLog): Promise<void>;
  upsertLogs(logs: DayLog[]): Promise<void>;
  deleteLog(date: string): Promise<void>;
  wipe(): Promise<void>;
  /** True only when the binary ships SQLCipher and the key is applied. */
  isEncrypted(): Promise<boolean>;
}

export function emptyLog(date: string): DayLog {
  return { date, period: false, symptoms: [], moods: [] };
}

export function isEmptyLog(l: DayLog): boolean {
  return !l.period && !l.flow && l.symptoms.length === 0 && l.moods.length === 0 && !l.energy && !l.notes?.trim();
}
