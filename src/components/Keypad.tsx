import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { haptics } from '../lib/haptics';
import { PIN_LENGTH } from '../lib/pin';
import { useColors, useIsDark } from '../theme/useTheme';
import { Glass } from './Glass';
import { PressScale, T } from './ui';

export type KeypadHandle = { shake: () => void };

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'] as const;

/**
 * Lock-screen PIN pad: glass circular keys, a selection tick on every press,
 * a warning buzz + horizontal shake on a wrong PIN.
 */
export const Keypad = forwardRef<
  KeypadHandle,
  {
    value: string;
    onChange: (v: string) => void;
    onComplete: (v: string) => void;
    bioLabel?: string;
    bioKind?: 'face' | 'fingerprint' | 'generic';
    onBio?: () => void;
    disabled?: boolean;
  }
>(function Keypad({ value, onChange, onComplete, bioLabel, bioKind, onBio, disabled }, ref) {
  const c = useColors();
  const isDark = useIsDark();
  const x = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  useImperativeHandle(ref, () => ({
    shake: () => {
      haptics.warning();
      x.value = withSequence(
        withTiming(-14, { duration: 50 }),
        withTiming(14, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withSpring(0, { damping: 8 })
      );
    },
  }));

  const press = (k: (typeof KEYS)[number]) => {
    if (disabled) return;
    if (k === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (k === 'bio') {
      onBio?.();
      return;
    }
    if (value.length >= PIN_LENGTH) return;
    const next = value + k;
    onChange(next);
    if (next.length === PIN_LENGTH) setTimeout(() => onComplete(next), 120);
  };

  return (
    <View style={{ alignItems: 'center', gap: 36 }}>
      <Animated.View style={[styles.dots, shakeStyle]} accessibilityLabel={`${value.length} of ${PIN_LENGTH} digits entered`}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { borderColor: c.text },
              i < value.length && { backgroundColor: c.text, transform: [{ scale: 1.1 }] },
            ]}
          />
        ))}
      </Animated.View>

      <View style={styles.grid}>
        {KEYS.map((k) => {
          if (k === 'bio' && !onBio) return <View key={k} style={styles.key} />;
          const label =
            k === 'bio' ? (
              <Ionicons name={bioKind === 'face' ? 'scan-outline' : 'finger-print'} size={30} color={c.text} />
            ) : k === 'del' ? (
              <Ionicons name="backspace-outline" size={28} color={c.text} />
            ) : (
              <T style={{ fontSize: 30, lineHeight: 36, fontWeight: '500' }}>{k}</T>
            );
          const plain = k === 'bio' || k === 'del';
          return (
            <PressScale
              key={k}
              haptic="tick"
              onPress={() => press(k)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={k === 'bio' ? `Unlock with ${bioLabel}` : k === 'del' ? 'Delete' : k}
            >
              {plain ? (
                <View style={[styles.key, { alignItems: 'center', justifyContent: 'center' }]}>{label}</View>
              ) : (
                <Glass radius={40} style={[styles.key, { alignItems: 'center', justifyContent: 'center' }]} tint={isDark ? 'rgba(255,255,255,0.06)' : undefined}>
                  {label}
                </Glass>
              )}
            </PressScale>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 22 },
  dot: { width: 15, height: 15, borderRadius: 8, borderWidth: 1.5 },
  grid: { width: 280, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 18 },
  key: { width: 80, height: 80, borderRadius: 40 },
});
