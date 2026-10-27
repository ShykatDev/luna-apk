import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type BiometricInfo = { available: boolean; label: string; kind: 'face' | 'fingerprint' | 'generic' };

export async function biometricInfo(): Promise<BiometricInfo> {
  try {
    const [hw, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    const face = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const finger = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
    const kind = face ? 'face' : finger ? 'fingerprint' : 'generic';
    const label = face ? (Platform.OS === 'ios' ? 'Face ID' : 'Face unlock') : finger ? (Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint') : 'Biometrics';
    return { available: hw && enrolled, label, kind };
  } catch {
    return { available: false, label: 'Biometrics', kind: 'generic' };
  }
}

/** Biometrics only — the device passcode is NOT accepted as a fallback; Luna's own PIN is. */
export async function authenticate(reason = 'Unlock Luna'): Promise<boolean> {
  try {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Use PIN',
      disableDeviceFallback: true,
      fallbackLabel: '',
      biometricsSecurityLevel: 'strong',
    });
    return r.success;
  } catch {
    return false;
  }
}
