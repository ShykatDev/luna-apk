import { create } from 'zustand';
import { biometricInfo, BiometricInfo } from '../lib/biometrics';
import { hasPin } from '../lib/pin';

type LockState = {
  /** True while the lock screen must cover the app. */
  locked: boolean;
  pinSet: boolean;
  bio: BiometricInfo;
  /** When the app last went to the background (ms). */
  backgroundedAt: number | null;
  refresh: () => Promise<void>;
  lock: () => void;
  unlock: () => void;
  setBackgroundedAt: (t: number | null) => void;
};

export const useLock = create<LockState>((set) => ({
  locked: false,
  pinSet: false,
  bio: { available: false, label: 'Biometrics', kind: 'generic' },
  backgroundedAt: null,
  refresh: async () => {
    const [pinSet, bio] = await Promise.all([hasPin(), biometricInfo()]);
    set({ pinSet, bio });
  },
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false, backgroundedAt: null }),
  setBackgroundedAt: (t) => set({ backgroundedAt: t }),
}));
