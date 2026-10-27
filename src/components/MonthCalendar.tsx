import { endOfMonth, getDay, startOfMonth } from 'date-fns';
import { memo, ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line } from 'react-native-svg';
import type { DayKind } from '../lib/cycle';
import { fmt, ISODate, toISO } from '../lib/dates';
import { haptics } from '../lib/haptics';
import { useColors, useIsDark } from '../theme/useTheme';
import { T } from './ui';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SIZE = 42;

/** Diagonal hatching inside a circle — marks predicted days (custom SVG). */
const Hatch = memo(function Hatch({ color, id }: { color: string; id: string }) {
  const lines = Array.from({ length: 12 }, (_, i) => i * 6 - SIZE);
  return (
    <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
      <Defs>
        <ClipPath id={id}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 1} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${id})`}>
        {lines.map((x) => (
          <Line key={x} x1={x} y1={SIZE} x2={x + SIZE} y2={0} stroke={color} strokeWidth={1.4} strokeOpacity={0.55} />
        ))}
      </G>
      <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 0.75} stroke={color} strokeWidth={1.5} strokeDasharray="3 3" fill="none" />
    </Svg>
  );
});

export function MonthCalendar({
  month,
  kinds = {},
  logged,
  today,
  selected,
  onPressDay,
  disableFuture,
  editMode,
}: {
  month: Date;
  kinds?: Record<ISODate, DayKind>;
  logged?: Set<ISODate>;
  today: ISODate;
  selected?: ISODate | null;
  onPressDay: (d: ISODate) => void;
  disableFuture?: boolean;
  editMode?: boolean;
}) {
  const c = useColors();
  const isDark = useIsDark();
  const first = startOfMonth(month);
  const days = endOfMonth(month).getDate();
  const lead = (getDay(first) + 6) % 7; // Monday-first
  const cells: (ISODate | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => toISO(new Date(first.getFullYear(), first.getMonth(), i + 1))),
  ];
  while (cells.length % 7) cells.push(null);

  const band = (k?: DayKind) =>
    k === 'period' ? c.periodSoft : k === 'fertile' || k === 'ovulation' ? c.fertileSoft : k === 'predictedPeriod' ? c.periodSoft : null;
  const group = (k?: DayKind) => (k === 'ovulation' ? 'fertile' : k);

  return (
    <View style={{ gap: 6 }}>
      <View style={styles.row}>
        {WEEKDAYS.map((w) => (
          <View key={w} style={styles.cell}>
            <T v="caption" color={c.textSecondary}>{w}</T>
          </View>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, r) => {
        const row = cells.slice(r * 7, r * 7 + 7);
        return (
          <View key={r} style={styles.row}>
            {row.map((d, i) => {
              if (!d) return <View key={i} style={styles.cell} />;
              const k = kinds[d];
              const prev = row[i - 1] ? kinds[row[i - 1]!] : undefined;
              const next = row[i + 1] ? kinds[row[i + 1]!] : undefined;
              const joinL = !!k && group(prev) === group(k) && !!band(k);
              const joinR = !!k && group(next) === group(k) && !!band(k);
              const isToday = d === today;
              const isSel = d === selected && !isToday;
              const future = d > today;
              const disabled = disableFuture && future;

              let bg = isDark ? c.fill : 'rgba(255,255,255,0.55)';
              let fg = c.text;
              let border = isDark ? c.separator : 'rgba(255,255,255,0.95)';
              if (k === 'period') { bg = c.period; fg = c.onPeriod; border = c.period; }
              else if (k === 'ovulation') { bg = c.fertile; fg = c.onFertile; border = c.fertile; }
              else if (k === 'fertile') { bg = c.fertileSoft; border = 'transparent'; }
              else if (k === 'predictedPeriod') { bg = 'transparent'; border = 'transparent'; }
              if (isToday) { bg = c.accent; fg = c.onAccent; border = c.accent; }

              return (
                <Pressable
                  key={d}
                  style={styles.cell}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={`${fmt(d, 'EEEE d MMMM')}${k ? ', ' + k.replace('predictedPeriod', 'predicted period') : ''}`}
                  accessibilityState={{ selected: d === selected, disabled }}
                  onPress={() => {
                    editMode ? haptics.thud() : haptics.tick();
                    onPressDay(d);
                  }}
                >
                  {(joinL || joinR) && (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.band,
                        { backgroundColor: band(k)!, left: joinL ? 0 : '50%', right: joinR ? 0 : '50%' },
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.day,
                      { backgroundColor: bg, borderColor: border },
                      isSel && { borderColor: c.text, borderWidth: 2 },
                      editMode && !future && k !== 'period' && { borderColor: c.period, borderStyle: 'dashed' },
                      disabled && { opacity: 0.35 },
                    ]}
                  >
                    {k === 'predictedPeriod' && !isToday && <Hatch color={c.period} id={`h-${d}`} />}
                    <T v="subhead" color={fg} style={{ fontWeight: isToday || k === 'period' ? '600' : '500', fontVariant: ['tabular-nums'], lineHeight: 18 }}>
                      {fmt(d, 'd')}
                    </T>
                    {isToday && <T v="caption" color={fg} style={{ fontSize: 8, lineHeight: 10 }}>Today</T>}
                    {logged?.has(d) && <View style={[styles.logDot, { backgroundColor: k === 'period' || isToday ? c.surface : c.period, borderColor: c.surface }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

export function Legend() {
  const c = useColors();
  const items: { label: string; node: ReactElement }[] = [
    { label: 'Period', node: <View style={[styles.sw, { backgroundColor: c.period }]} /> },
    {
      label: 'Predicted',
      node: (
        <View style={[styles.sw, { overflow: 'hidden' }]}>
          <Svg width={12} height={12}>
            <Circle cx={6} cy={6} r={5.2} stroke={c.period} strokeDasharray="2 2" strokeWidth={1.3} fill="none" />
            <Line x1={2} y1={10} x2={10} y2={2} stroke={c.period} strokeWidth={1.2} />
          </Svg>
        </View>
      ),
    },
    { label: 'Fertile', node: <View style={[styles.sw, { backgroundColor: c.fertileSoft, borderWidth: 1, borderColor: c.fertile }]} /> },
    { label: 'Ovulation', node: <View style={[styles.sw, { backgroundColor: c.fertile }]} /> },
    { label: 'Logged', node: <View style={[styles.sw, { width: 7, height: 7, backgroundColor: c.period }]} /> },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 8 }}>
      {items.map((i) => (
        <View key={i.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {i.node}
          <T v="footnote" color={c.textSecondary}>{i.label}</T>
        </View>
      ))}
    </View>
  );
}

export const monthTitle = (d: Date) => fmt(toISO(d), 'MMMM yyyy');

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', height: SIZE + 6 },
  band: { position: 'absolute', top: 3, height: SIZE },
  day: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
  },
  logDot: { position: 'absolute', top: 0, right: 0, width: 9, height: 9, borderRadius: 5, borderWidth: 1.5 },
  sw: { width: 12, height: 12, borderRadius: 6 },
});
