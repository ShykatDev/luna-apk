import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useColors } from '../theme/useTheme';
import { phaseSegments } from './ArcGauge';
import { T } from './ui';

/** Horizontal strip of the whole cycle with a marker sliding to today. */
export function PhaseStrip({ cycleDay, avgCycle, avgPeriod }: { cycleDay: number; avgCycle: number; avgPeriod: number }) {
  const c = useColors();
  const [w, setW] = useState(0);
  const color: Record<string, string> = { menstrual: c.period, follicular: c.follicular, ovulation: c.fertile, luteal: c.luteal };
  const label: Record<string, string> = { menstrual: 'Period', follicular: 'Follicular', ovulation: 'Fertile', luteal: 'Luteal' };
  const segs = phaseSegments(avgCycle, avgPeriod).map((s) => ({ ...s, days: s.to - s.from + 1 }));
  const total = segs.reduce((a, s) => a + s.days, 0);
  const x = useSharedValue(0);
  useEffect(() => {
    if (!w) return;
    x.value = withTiming(((Math.min(cycleDay, total) - 0.5) / total) * w, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [w, cycleDay, total, x]);
  const marker = useAnimatedStyle(() => ({ transform: [{ translateX: x.value - 9 }] }));

  return (
    <View style={{ gap: 8 }}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={styles.bar}>
        {segs.map((s, i) => (
          <View key={s.key} style={{ flex: s.days, backgroundColor: color[s.key], marginLeft: i ? 3 : 0, borderRadius: 6 }} />
        ))}
        {w > 0 && <Animated.View style={[styles.marker, { borderColor: c.primary, backgroundColor: c.surface }, marker]} />}
      </View>
      <View style={{ flexDirection: 'row' }}>
        {segs.map((s) => (
          <View key={s.key} style={{ flex: s.days, minWidth: 0 }}>
            <T v="caption" color={c.textSecondary} numberOfLines={1}>{s.days >= 4 ? label[s.key] : ''}</T>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', height: 12 },
  marker: { position: 'absolute', top: -5, width: 18, height: 22, borderRadius: 9, borderWidth: 3 },
});
