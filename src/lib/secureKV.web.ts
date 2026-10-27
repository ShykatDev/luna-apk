/** Web preview only — browsers have no secure keychain, so this uses localStorage. */
export const secureKV = {
  get: async (k: string) => {
    try {
      return globalThis.localStorage?.getItem(k) ?? null;
    } catch {
      return null;
    }
  },
  set: async (k: string, v: string) => {
    try {
      globalThis.localStorage?.setItem(k, v);
    } catch {}
  },
  del: async (k: string) => {
    try {
      globalThis.localStorage?.removeItem(k);
    } catch {}
  },
};
