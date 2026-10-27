import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  Extrapolation,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { haptics } from '../lib/haptics';
import { radius, type } from '../theme/tokens';
import { useColors } from '../theme/useTheme';
import { T } from './ui';

const ITEM_H = 40;
const VISIBLE = 5;

type Props = {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  /** Fixed unit label next to the selection band — like "hours" / "min" in Clock › Timer. */
  unit?: string;
  width?: number;
  accessibilityLabel?: string;
  /** Display formatter, e.g. zero-padded minutes. */
  format?: (v: number) => string;
  /** Hide the selection band when several wheels share one (time picker). */
  hideBand?: boolean;
};

/**
 * iOS Clock-Timer-style wheel:
 * - 3D drum (rotateX + fade) driven on the UI thread by Reanimated
 * - a selection-haptic "detent" every time a new row crosses the centre
 * - snaps to rows, unit label pinned beside the selection band
 */
export function WheelPicker({ values, value, onChange, unit, width = 120, accessibilityLabel, format = String, hideBand }: Props) {
  const c = useColors();
  const ref = useAnimatedRef<Animated.ScrollView>();
  const y = useSharedValue(Math.max(0, values.indexOf(value)) * ITEM_H);
  const lastIndex = useSharedValue(Math.max(0, values.indexOf(value)));
  const initialIndex = useRef(Math.max(0, values.indexOf(value))).current;

  // Scroll to the external value when it changes (and on mount for web).
  useEffect(() => {
    const idx = Math.max(0, values.indexOf(value));
    if (idx !== lastIndex.value || Platform.OS === 'web') {
      lastIndex.value = idx;
      requestAnimationFrame(() => ref.current?.scrollTo({ y: idx * ITEM_H, animated: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      y.value = e.contentOffset.y;
    },
  });

  // Detent haptics: fire whenever the centred row changes, like a physical wheel.
  useAnimatedReaction(
    () => Math.min(values.length - 1, Math.max(0, Math.round(y.value / ITEM_H))),
    (idx, prev) => {
      if (prev !== null && idx !== prev) scheduleOnRN(haptics.tick);
    }
  );

  const commit = (offsetY: number) => {
    const idx = Math.min(values.length - 1, Math.max(0, Math.round(offsetY / ITEM_H)));
    lastIndex.value = idx;
    if (values[idx] !== value) onChange(values[idx]);
  };

  const items = useMemo(() => values, [values]);

  return (
    <View
      style={{ width, height: ITEM_H * VISIBLE }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: `${format(value)}${unit ? ' ' + unit : ''}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const i = values.indexOf(value);
        const next = e.nativeEvent.actionName === 'increment' ? values[i + 1] : values[i - 1];
        if (next !== undefined) {
          haptics.tick();
          onChange(next);
        }
      }}
    >
      {/* Selection band */}
      {!hideBand && <View
        pointerEvents="none"
        style={[styles.band, { top: ITEM_H * 2, backgroundColor: c.fill, borderRadius: radius.sm }]}
      />}
      <Animated.ScrollView
        ref={ref}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentOffset={{ x: 0, y: initialIndex * ITEM_H }}
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        onMomentumScrollEnd={(e) => commit(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e) => {
          // If there's no momentum, momentum end won't fire (iOS) — commit here too.
          if (Platform.OS !== 'android') commit(e.nativeEvent.contentOffset.y);
        }}
      >
        {items.map((v, i) => (
          <WheelItem key={v} index={i} y={y} label={format(v)} color={c.text} padRight={unit ? 44 : 0} />
        ))}
      </Animated.ScrollView>
      {unit && (
        <View pointerEvents="none" style={[styles.unit, { top: ITEM_H * 2 }]}>
          <T v="headline" color={c.text}>{unit}</T>
        </View>
      )}
    </View>
  );
}

function WheelItem({ index, y, label, color, padRight }: { index: number; y: SharedValue<number>; label: string; color: string; padRight: number }) {
  const style = useAnimatedStyle(() => {
    const d = (y.value - index * ITEM_H) / ITEM_H; // rows from centre
    return {
      opacity: interpolate(Math.abs(d), [0, 1, 2, 2.6], [1, 0.55, 0.22, 0], Extrapolation.CLAMP),
      transform: [
        { perspective: 400 },
        { rotateX: `${interpolate(d, [-3, 0, 3], [62, 0, -62], Extrapolation.CLAMP)}deg` },
        { scale: interpolate(Math.abs(d), [0, 2], [1, 0.88], Extrapolation.CLAMP) },
      ],
    };
  });
  return (
    <Animated.View style={[styles.item, { paddingRight: padRight }, style]}>
      <T style={[type.title3, { fontSize: 22, fontVariant: ['tabular-nums'] }]} color={color}>
        {label}
      </T>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  band: { position: 'absolute', left: 0, right: 0, height: ITEM_H },
  unit: { position: 'absolute', right: 10, height: ITEM_H, justifyContent: 'center' },
});
