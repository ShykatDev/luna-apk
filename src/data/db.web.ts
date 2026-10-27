/**
 * Web build is for design previews only (no SQLCipher in the browser).
 * Data is kept in localStorage of that browser.
 */
import { DayLog, defaultSettings, Settings, Snapshot, Storage, withDefaults } from './types';

const KEY = 'luna_preview_v1';

function read(): Snapshot {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Snapshot;
      return { settings: withDefaults(s.settings), logs: s.logs ?? {} };
    }
  } catch {}
  return { settings: defaultSettings, logs: {} };
}

function write(s: Snapshot) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(s));
  } catch {}
}

class WebStorage implements Storage {
  async open() {}
  async load() {
    return read();
  }
  async saveSettings(settings: Settings) {
    write({ ...read(), settings });
  }
  async upsertLog(l: DayLog) {
    const s = read();
    s.logs[l.date] = l;
    write(s);
  }
  async upsertLogs(logs: DayLog[]) {
    const s = read();
    for (const l of logs) s.logs[l.date] = l;
    write(s);
  }
  async deleteLog(date: string) {
    const s = read();
    delete s.logs[date];
    write(s);
  }
  async wipe() {
    try {
      globalThis.localStorage?.removeItem(KEY);
    } catch {}
  }
  async isEncrypted() {
    return false;
  }
}

export const storage: Storage = new WebStorage();
