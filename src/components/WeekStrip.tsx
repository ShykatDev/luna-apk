import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { DayKind } from '../lib/cycle';
import { addDaysISO, fmt, ISODate } from '../lib/dates';
import { radius } from '../theme/tokens';
import { useColors, useIsDark } from '../theme/useTheme';
import { Glass } from './Glass';
import { PressScale, T } from './ui';

const W = 50;
const GAP = 8;

/**
 * Capsule day strip: weekday on top, date in an inner circle. Today is a
 * filled capsule; period days get a magenta disc, predicted days a dashed ring.
 */
export function WeekStrip({
  today,
  kinds,
  logged,
  onPressDay,
}: {
  today: ISODate;
  kinds: Record<ISODate, DayKind>;
  logged: Set<ISODate>;
  onPressDay: (d: ISODate) => void;
}) {
  const c = useColors();
  const isDark = useIsDark();
  const days = useMemo(() => Array.from({ length: 29 }, (_, i) => addDaysISO(today, i - 21)), [today]);

  return (
    <FlatList
      horizontal
      data={days}
      keyExtractor={(d) => d}
      showsHorizontalScrollIndicator={false}
      initialScrollIndex={18}
      getItemLayout={(_, i) => ({ length: W + GAP, offset: (W + GAP) * i, index: i })}
      contentContainerStyle={{ gap: GAP, paddingVertical: 2 }}
      style={{ marginHorizontal: -16 }}
      ListHeaderComponent={<View style={{ width: 16 - GAP }} />}
      ListFooterComponent={<View style={{ width: 16 - GAP }} />}
      renderItem={({ item: d }) => {
        const k = kinds[d];
        const isToday = d === today;
        const future = d > today;
        const discBg = k === 'period' ? c.period : isToday ? c.surface : isDark ? c.fill : c.surfaceAlt;
        const discFg = k === 'period' ? c.onPeriod : isToday ? c.text : future ? c.textTertiary : c.text;
        const inner = (
          <View style={{ alignItems: 'center', gap: 8, paddingTop: 10, paddingBottom: 6 }}>
            <T v="caption" color={isToday ? c.onAccent : c.textSecondary}>
              {isToday ? 'Today' : fmt(d, 'EEE')}
            </T>
            <View style={[styles.disc, { backgroundColor: discBg }]}>
              {k === 'predictedPeriod' && (
                <Svg width={38} height={38} style={StyleSheet.absoluteFill}>
                  <Circle cx={19} cy={19} r={17.5} stroke={c.period} strokeWidth={1.5} strokeDasharray="3 3" fill="none" />
                </Svg>
              )}
              <T v="callout" color={discFg} style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}>{fmt(d, 'd')}</T>
            </View>
            {(() => {
              const dot = logged.has(d) ? c.accent : k === 'ovulation' ? c.ovulation : k === 'fertile' ? c.fertile : null;
              // On the filled "Today" capsule, use the capsule's text colour so the dot always stands out
              return <View style={[styles.dot, isToday && dot && styles.todayDot, { backgroundColor: dot ? (isToday ? c.onAccent : dot) : 'transparent' }]} />;
            })()}
          </View>
        );
        return (
          <PressScale haptic="tick" onPress={() => !future && onPressDay(d)} accessibilityLabel={fmt(d, 'EEEE d MMMM')} disabled={false}>
            {isToday ? (
              <View style={[styles.capsule, { backgroundColor: c.accent }]}>{inner}</View>
            ) : (
              <Glass radius={radius.pill} style={styles.capsule}>{inner}</Glass>
            )}
          </PressScale>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  capsule: { width: W, borderRadius: radius.pill, alignItems: 'center' },
  disc: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3 },
  todayDot: { width: 6, height: 6 },
});
