/**
 * Native storage: SQLite encrypted with SQLCipher.
 * - A random 256-bit key is generated on first launch and kept in the
 *   iOS Keychain / Android Keystore (expo-secure-store), never leaves the device.
 * - SQLCipher is compiled in via the `useSQLCipher` plugin option in app.json.
 *   Expo Go does NOT include SQLCipher → data is plain SQLite there.
 *   Use a development build (`npx expo run:ios|android`) for real encryption.
 */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
import { DayLog, Settings, Snapshot, Storage, withDefaults } from './types';

const KEY_NAME = 'luna_db_key_v1';
const DB_NAME = 'luna.db';

async function getOrCreateKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(KEY_NAME);
  if (!key) {
    const bytes = Crypto.getRandomBytes(32);
    key = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    await SecureStore.setItemAsync(KEY_NAME, key, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
  return key;
}

type LogRow = {
  date: string;
  period: number;
  flow: string | null;
  symptoms: string;
  moods: string;
  energy: string | null;
  notes: string | null;
};

function toRow(l: DayLog) {
  return [
    l.date,
    l.period ? 1 : 0,
    l.flow ?? null,
    JSON.stringify(l.symptoms),
    JSON.stringify(l.moods),
    l.energy ?? null,
    l.notes?.trim() ? l.notes : null,
  ];
}

function fromRow(r: LogRow): DayLog {
  return {
    date: r.date,
    period: r.period === 1,
    flow: (r.flow ?? undefined) as DayLog['flow'],
    symptoms: JSON.parse(r.symptoms),
    moods: JSON.parse(r.moods),
    energy: (r.energy ?? undefined) as DayLog['energy'],
    notes: r.notes ?? undefined,
  };
}

const UPSERT = `INSERT INTO day_logs (date, period, flow, symptoms, moods, energy, notes, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s','now'))
  ON CONFLICT(date) DO UPDATE SET period=excluded.period, flow=excluded.flow, symptoms=excluded.symptoms,
  moods=excluded.moods, energy=excluded.energy, notes=excluded.notes, updated_at=excluded.updated_at`;

class SQLiteStorage implements Storage {
  private db: SQLite.SQLiteDatabase | null = null;

  private get conn() {
    if (!this.db) throw new Error('Storage not opened');
    return this.db;
  }

  async open() {
    if (this.db) return;
    const key = await getOrCreateKey();
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    // Raw 256-bit key (hex) — must be the first statement after opening.
    await db.execAsync(`PRAGMA key = "x'${key}'";`);
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS day_logs (
        date TEXT PRIMARY KEY NOT NULL,
        period INTEGER NOT NULL DEFAULT 0,
        flow TEXT,
        symptoms TEXT NOT NULL DEFAULT '[]',
        moods TEXT NOT NULL DEFAULT '[]',
        energy TEXT,
        notes TEXT,
        updated_at INTEGER NOT NULL
      );
    `);
    this.db = db;
  }

  async load(): Promise<Snapshot> {
    const row = await this.conn.getFirstAsync<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      'app'
    );
    const settings: Settings = withDefaults(row ? JSON.parse(row.value) : undefined);
    const rows = await this.conn.getAllAsync<LogRow>('SELECT * FROM day_logs');
    const logs: Record<string, DayLog> = {};
    for (const r of rows) logs[r.date] = fromRow(r);
    return { settings, logs };
  }

  async saveSettings(s: Settings) {
    await this.conn.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      'app',
      JSON.stringify(s)
    );
  }

  async upsertLog(l: DayLog) {
    await this.conn.runAsync(UPSERT, toRow(l));
  }

  async upsertLogs(logs: DayLog[]) {
    await this.conn.withTransactionAsync(async () => {
      for (const l of logs) await this.conn.runAsync(UPSERT, toRow(l));
    });
  }

  async deleteLog(date: string) {
    await this.conn.runAsync('DELETE FROM day_logs WHERE date = ?', date);
  }

  async wipe() {
    await this.conn.execAsync('DELETE FROM day_logs; DELETE FROM settings;');
  }

  async isEncrypted() {
    try {
      const r = await this.conn.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
      return !!r?.cipher_version;
    } catch {
      return false;
    }
  }
}

export const storage: Storage = new SQLiteStorage();
