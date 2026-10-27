import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authenticate } from '../lib/biometrics';
import { haptics } from '../lib/haptics';
import { getAttempts, recordFailure, resetAttempts, verifyPin } from '../lib/pin';
import { useApp } from '../store/useAppStore';
import { useLock } from '../store/useLock';
import { space } from '../theme/tokens';
import { useColors } from '../theme/useTheme';
import { Background } from './Background';
import { Bloom } from './icons';
import { Keypad, KeypadHandle } from './Keypad';
import { T } from './ui';

/**
 * Wraps the whole app:
 * - locks on launch and after `autoLockAfter` seconds in the background
 * - covers the UI in the app switcher (so nothing shows in the snapshot)
 * - closes any open sheet before locking so nothing sits above the lock screen
 */
export function AppLockGate() {
  const lockCfg = useApp((s) => s.settings.lock);
  const ready = useApp((s) => s.ready);
  const { locked, lock, refresh, setBackgroundedAt } = useLock();
  const [covered, setCovered] = useState(false);
  const [checked, setChecked] = useState(false);
  const booted = useRef(false);

  // Lock on cold start
  useEffect(() => {
    if (!ready || booted.current) return;
    booted.current = true;
    refresh().then(() => {
      if (useApp.getState().settings.lock.enabled && useLock.getState().pinSet) lock();
      setChecked(true);
    });
  }, [ready, refresh, lock]);

  useEffect(() => {
    const onChange = (s: AppStateStatus) => {
      const cfg = useApp.getState().settings.lock;
      if (s === 'active') {
        setCovered(false);
        const since = useLock.getState().backgroundedAt;
        if (cfg.enabled && useLock.getState().pinSet && since != null && Date.now() - since >= cfg.autoLockAfter * 1000) {
          if (router.canDismiss()) router.dismissAll();
          lock();
        }
        setBackgroundedAt(null);
      } else {
        if (cfg.enabled ? cfg.hideInSwitcher : false) setCovered(true);
        if (s === 'background' && useLock.getState().backgroundedAt == null) setBackgroundedAt(Date.now());
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [lock, setBackgroundedAt]);

  if (!lockCfg.enabled) return null;
  if (locked) return <LockScreen />;
  if (!checked) return <PrivacyCover />; // never flash content before the lock decision
  if (covered) return <PrivacyCover />;
  return null;
}

function PrivacyCover() {
  const c = useColors();
  return (
    <View style={[StyleSheet.absoluteFill, styles.center, { zIndex: 100 }]} pointerEvents="none">
      <Background />
      <Bloom size={120} colors={[c.follicular, c.period, c.accent]} />
    </View>
  );
}

function LockScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { unlock, bio } = useLock();
  const bioEnabled = useApp((s) => s.settings.lock.biometrics) && bio.available;
  const name = useApp((s) => s.settings.name);
  const resetAll = useApp((s) => s.resetAll);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const pad = useRef<KeypadHandle>(null);

  useEffect(() => {
    getAttempts().then((a) => setLockedUntil(a.lockedUntil));
  }, []);

  // Countdown while rate-limited; stops (and re-enables the keypad) when the pause ends
  useEffect(() => {
    setNow(Date.now());
    if (lockedUntil <= Date.now()) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= lockedUntil) clearInterval(t);
    }, 500);
    return () => clearInterval(t);
  }, [lockedUntil]);

  const tryBio = useCallback(async () => {
    if (!bioEnabled) return;
    if (await authenticate('Unlock Luna')) {
      await resetAttempts();
      haptics.success();
      unlock();
    }
  }, [bioEnabled, unlock]);

  // Offer biometrics straight away, like banking apps do
  useEffect(() => {
    const t = setTimeout(tryBio, 350);
    return () => clearTimeout(t);
  }, [tryBio]);

  const onComplete = async (v: string) => {
    if (await verifyPin(v)) {
      await resetAttempts();
      haptics.success();
      unlock();
      return;
    }
    const a = await recordFailure();
    pad.current?.shake();
    setPin('');
    const paused = a.lockedUntil > Date.now();
    if (paused) setLockedUntil(a.lockedUntil);
    setError(paused ? null : `Wrong PIN${a.failed >= 3 ? ` · ${5 - a.failed} ${5 - a.failed === 1 ? 'try' : 'tries'} before a pause` : ''}`);
  };

  const forgot = () => {
    const msg = bioEnabled
      ? `Use ${bio.label} to unlock, then change your PIN in Settings.`
      : 'Your data is only on this device and encrypted, so there’s no way to recover the PIN. You can erase everything and start fresh.';
    const erase = async () => {
      await resetAll();
      unlock();
      router.replace('/onboarding');
    };
    if (Platform.OS === 'web') {
      if (!bioEnabled && globalThis.confirm?.(`${msg}\n\nErase all data?`)) erase();
      return;
    }
    Alert.alert('Forgot your PIN?', msg, bioEnabled
      ? [{ text: 'Cancel', style: 'cancel' }, { text: `Use ${bio.label}`, onPress: tryBio }]
      : [{ text: 'Cancel', style: 'cancel' }, { text: 'Erase all data', style: 'destructive', onPress: erase }]);
  };

  const waiting = lockedUntil > now;
  const secs = Math.ceil((lockedUntil - now) / 1000);

  return (
    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(250)} style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
      <Background />
      <View style={[styles.wrap, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}>
        <View style={{ alignItems: 'center', gap: space.md }}>
          <Bloom size={84} colors={[c.follicular, c.period, c.accent]} />
          <T v="title2">{name ? `Welcome back, ${name}` : 'Welcome back'}</T>
          <T v="subhead" color={error ? c.danger : c.textSecondary} accessibilityLiveRegion="polite">
            {waiting ? `Too many attempts. Try again in ${secs}s` : error ?? 'Enter your PIN'}
          </T>
        </View>

        <Keypad
          ref={pad}
          value={pin}
          onChange={(v) => {
            setError(null);
            setPin(v);
          }}
          onComplete={onComplete}
          disabled={waiting}
          onBio={bioEnabled ? tryBio : undefined}
          bioLabel={bio.label}
          bioKind={bio.kind}
        />

        <Pressable onPress={forgot} hitSlop={12} accessibilityRole="button">
          <T v="subhead" color={c.accent} style={{ fontWeight: '600' }}>Forgot PIN?</T>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
});
