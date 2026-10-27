import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { fmt } from '../lib/dates';
import { useColors } from '../theme/useTheme';
import { T } from './ui';

type Bar = { key: string; start: string; length: number; periodLength: number; current?: boolean };

/**
 * Apple Health-style vertical bars: one per cycle. The rose cap at the
 * bottom is the period, the lavender body the rest of the cycle.
 */
export function CycleBars({ bars, avg, height = 160 }: { bars: Bar[]; avg: number; height?: number }) {
  const c = useColors();
  const max = Math.max(avg + 4, ...bars.map((b) => b.length));
  return (
    <View>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
        <View pointerEvents="none" style={[styles.avgLine, { bottom: (avg / max) * height, borderColor: c.textTertiary }]}>
          <T v="caption" color={c.textSecondary} style={styles.avgLabel}>avg {avg}d</T>
        </View>
        {bars.map((b, i) => (
          <BarCol key={b.key} bar={b} max={max} height={height} delay={i * 60} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
        {bars.map((b) => (
          <T key={b.key} v="caption" color={c.textSecondary} style={{ flex: 1, textAlign: 'center' }}>
            {fmt(b.start, 'MMM')}
          </T>
        ))}
      </View>
    </View>
  );
}

function BarCol({ bar, max, height, delay }: { bar: Bar; max: number; height: number; delay: number }) {
  const c = useColors();
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(delay, withTiming((bar.length / max) * height, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [bar.length, max, height, delay, h]);
  const style = useAnimatedStyle(() => ({ height: h.value }));
  const periodShare = Math.min(1, bar.periodLength / bar.length);
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <T v="caption" color={c.text} style={{ fontWeight: '700', marginBottom: 4, fontVariant: ['tabular-nums'] }}>
        {bar.length}
      </T>
      <Animated.View
        style={[
          styles.bar,
          { backgroundColor: bar.current ? c.accentSoft : c.luteal, borderWidth: bar.current ? 1.5 : 0, borderColor: c.luteal, borderStyle: 'dashed' },
          style,
        ]}
      >
        <View style={{ flex: 1 - periodShare }} />
        <View style={{ flex: periodShare, backgroundColor: c.period }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { width: '100%', maxWidth: 30, borderRadius: 15, overflow: 'hidden' },
  avgLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed' },
  avgLabel: { position: 'absolute', right: 0, top: -16 },
});
