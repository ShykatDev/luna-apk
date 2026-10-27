import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Glass } from '../components/Glass';
import { Icon } from '../components/icons';
import { Keypad, KeypadHandle } from '../components/Keypad';
import { PrimaryButton, T, Toggle } from '../components/ui';
import { authenticate } from '../lib/biometrics';
import { haptics } from '../lib/haptics';
import { clearPin, setPin, verifyPin } from '../lib/pin';
import { useApp } from '../store/useAppStore';
import { useLock } from '../store/useLock';
import { space } from '../theme/tokens';
import { useColors } from '../theme/useTheme';

type Mode = 'create' | 'change' | 'disable';
type Step = 'verify' | 'enter' | 'confirm' | 'biometrics';

/**
 * create:  enter → confirm → (offer biometrics) → lock on
 * change:  verify current → enter → confirm
 * disable: verify current (or biometrics) → lock off, PIN erased
 */
export default function LockSetup() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { mode = 'create' } = useLocalSearchParams<{ mode: Mode }>();
  const { bio, refresh } = useLock();
  const lockCfg = useApp((s) => s.settings.lock);
  const updateSettings = useApp((s) => s.updateSettings);
  const [step, setStep] = useState<Step>(mode === 'create' ? 'enter' : 'verify');
  const [value, setValue] = useState('');
  const [first, setFirst] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [useBio, setUseBio] = useState(true);
  const pad = useRef<KeypadHandle>(null);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const fail = (msg: string) => {
    pad.current?.shake();
    setError(msg);
    setValue('');
  };

  const finishDisable = async () => {
    await clearPin();
    await updateSettings({ lock: { ...lockCfg, enabled: false, biometrics: false } });
    await refresh();
    haptics.success();
    router.back();
  };

  const onComplete = async (v: string) => {
    setError(null);
    if (step === 'verify') {
      if (!(await verifyPin(v))) return fail('That PIN doesn’t match');
      if (mode === 'disable') return finishDisable();
      setValue('');
      setStep('enter');
      return;
    }
    if (step === 'enter') {
      if (/^(\d)\1+$/.test(v) || '0123456789'.includes(v) || '9876543210'.includes(v)) return fail('Too easy to guess — try another');
      setFirst(v);
      setValue('');
      setStep('confirm');
      return;
    }
    if (step === 'confirm') {
      if (v !== first) {
        setStep('enter');
        setFirst('');
        return fail('PINs didn’t match — start again');
      }
      await setPin(v);
      await refresh();
      if (mode === 'create' && bio.available) {
        setStep('biometrics');
        return;
      }
      await updateSettings({ lock: { ...lockCfg, enabled: true } });
      haptics.success();
      router.back();
    }
  };

  const finishCreate = async () => {
    let biometrics = false;
    if (useBio) biometrics = await authenticate(`Turn on ${bio.label} for Luna`);
    await updateSettings({ lock: { ...lockCfg, enabled: true, biometrics } });
    haptics.success();
    router.back();
  };

  const titles: Record<Step, [string, string]> = {
    verify: [mode === 'disable' ? 'Turn off app lock' : 'Change PIN', 'Enter your current PIN'],
    enter: [mode === 'change' ? 'Choose a new PIN' : 'Create a PIN', 'Use 4 digits you’ll remember'],
    confirm: ['Confirm your PIN', 'Enter the same 4 digits again'],
    biometrics: [`Use ${bio.label}?`, 'Unlock faster. Your PIN still works as a backup.'],
  };

  return (
    <View style={{ flex: 1 }}>
      <Background />
      <View style={[styles.header]}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <T v="callout" color={c.textSecondary}>Cancel</T>
        </Pressable>
      </View>
      <View style={[styles.wrap, { paddingBottom: insets.bottom + 24 }]}>
        <Animated.View key={step} entering={FadeInDown.duration(300)} style={{ alignItems: 'center', gap: space.sm }}>
          <View style={[styles.badge, { backgroundColor: c.accentSoft }]}>
            <Icon name={step === 'biometrics' ? 'shield' : 'lock'} size={30} color={c.accent} />
          </View>
          <T v="title2" style={{ textAlign: 'center' }}>{titles[step][0]}</T>
          <T v="subhead" color={error ? c.danger : c.textSecondary} style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
            {error ?? titles[step][1]}
          </T>
        </Animated.View>

        {step === 'biometrics' ? (
          <Animated.View entering={FadeIn} style={{ width: '100%', gap: space.lg }}>
            <Glass style={styles.row}>
              <T v="headline" style={{ flex: 1 }}>Unlock with {bio.label}</T>
              <Toggle label={`Unlock with ${bio.label}`} value={useBio} onChange={setUseBio} activeColor={c.accent} />
            </Glass>
            <PrimaryButton title="Done" onPress={finishCreate} />
          </Animated.View>
        ) : (
          <Keypad
            ref={pad}
            value={value}
            onChange={(v) => {
              setError(null);
              setValue(v);
            }}
            onComplete={onComplete}
            onBio={
              step === 'verify' && lockCfg.biometrics && bio.available
                ? async () => {
                    if (await authenticate()) {
                      if (mode === 'disable') return finishDisable();
                      setStep('enter');
                    }
                  }
                : undefined
            }
            bioLabel={bio.label}
            bioKind={bio.kind}
          />
        )}
        <View style={{ height: 20 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.lg, paddingTop: space.xl, paddingBottom: space.sm },
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xl, paddingTop: space.lg },
  badge: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', padding: space.lg, gap: 12 },
});
