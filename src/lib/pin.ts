/**
 * App-lock PIN.
 * - Only a salted, iterated SHA-256 hash is stored, in the Keychain/Keystore.
 * - Failed attempts persist across restarts; after 5 wrong PINs the keypad
 *   locks for 30 s, doubling each further miss (max 15 min).
 * - There is no "recover PIN" server by design. If a PIN is forgotten and
 *   biometrics aren't set up, the only way back in is erasing the app's data.
 */
import * as Crypto from 'expo-crypto';
import { secureKV } from './secureKV';

export const PIN_LENGTH = 4;
const K_PIN = 'luna_pin_v1';
const K_ATTEMPTS = 'luna_pin_attempts_v1';
const ITERATIONS = 200;

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

async function hash(pin: string, salt: string) {
  let h = `${salt}:${pin}`;
  for (let i = 0; i < ITERATIONS; i++) {
    h = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}${h}`);
  }
  return h;
}

/** Constant-time-ish comparison so timing doesn't leak how many characters matched. */
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function hasPin() {
  return !!(await secureKV.get(K_PIN));
}

export async function setPin(pin: string) {
  const salt = hex(Crypto.getRandomBytes(16));
  await secureKV.set(K_PIN, JSON.stringify({ salt, hash: await hash(pin, salt) }));
  await resetAttempts();
}

export async function verifyPin(pin: string) {
  const raw = await secureKV.get(K_PIN);
  if (!raw) return false;
  const { salt, hash: stored } = JSON.parse(raw) as { salt: string; hash: string };
  return same(await hash(pin, salt), stored);
}

export async function clearPin() {
  await secureKV.del(K_PIN);
  await resetAttempts();
}

// ---- attempt limiting -------------------------------------------------------

export type Attempts = { failed: number; lockedUntil: number };

/** Pure policy: how long to block after `failed` consecutive wrong PINs. */
export function lockoutMs(failed: number) {
  if (failed < 5) return 0;
  return Math.min(30_000 * 2 ** (failed - 5), 15 * 60_000);
}

export async function getAttempts(): Promise<Attempts> {
  try {
    const raw = await secureKV.get(K_ATTEMPTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { failed: 0, lockedUntil: 0 };
}

export async function recordFailure(now = Date.now()): Promise<Attempts> {
  const a = await getAttempts();
  const failed = a.failed + 1;
  const next = { failed, lockedUntil: now + lockoutMs(failed) };
  await secureKV.set(K_ATTEMPTS, JSON.stringify(next));
  return next;
}

export async function resetAttempts() {
  await secureKV.del(K_ATTEMPTS);
}
