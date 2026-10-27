/** Small secrets (PIN hash, lockout counters) live in the Keychain / Keystore, not in the database. */
import * as SecureStore from 'expo-secure-store';

const opts = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export const secureKV = {
  get: (k: string) => SecureStore.getItemAsync(k, opts),
  set: (k: string, v: string) => SecureStore.setItemAsync(k, v, opts),
  del: (k: string) => SecureStore.deleteItemAsync(k, opts),
};
