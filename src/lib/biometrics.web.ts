import type { BiometricInfo } from './biometrics';

export type { BiometricInfo };

export async function biometricInfo(): Promise<BiometricInfo> {
  return { available: false, label: 'Biometrics', kind: 'generic' };
}

export async function authenticate(): Promise<boolean> {
  return false;
}
