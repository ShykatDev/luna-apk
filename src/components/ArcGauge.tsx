import { ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Defs, G, LinearGradient, Mask, Path, Rect, Stop } from 'react-native-svg';
import { useColors } from '../theme/useTheme';

/**
 * Phase gauge: a 220° arc split into the four cycle phases, with a rounded
 * triangle pointer that sweeps to today. All custom SVG.
 */
const START = 160; // degrees, 0 = 3 o'clock, clockwise (screen coords)
const SWEEP = 220;
const GAP = 5;

const rad = (d: number) => (d * Math.PI) / 180;

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p0 = [cx + r * Math.cos(rad(a0)), cy + r * Math.sin(rad(a0))];
  const p1 = [cx + r * Math.cos(rad(a1)), cy + r * Math.sin(rad(a1))];
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${p0[0]} ${p0[1]} A ${r} ${r} 0 ${large} 1 ${p1[0]} ${p1[1]}`;
}

export function phaseSegments(avgCycle: number, avgPeriod: number) {
  const ovDay = avgCycle - 13;
  return [
    { key: 'menstrual', from: 1, to: avgPeriod },
    { key: 'follicular', from: avgPeriod + 1, to: ovDay - 6 },
    { key: 'ovulation', from: ovDay - 5, to: ovDay + 1 },
    { key: 'luteal', from: ovDay + 2, to: avgCycle },
  ].filter((s) => s.to >= s.from);
}

export function ArcGauge({
  width = 300,
  cycleDay,
  avgCycle,
  avgPeriod,
  children,
}: {
  width?: number;
  cycleDay: number | null;
  avgCycle: number;
  avgPeriod: number;
  children?: ReactNode;
}) {
  const c = useColors();
  const stroke = 18;
  const r = width / 2 - stroke;
  const cx = width / 2;
  const cy = width / 2;
  const height = cy + r * Math.sin(rad(START)) + stroke * 1.4;
  const day = Math.min(cycleDay ?? 1, avgCycle);
  const target = START + ((day - 0.5) / avgCycle) * SWEEP;

  const angle = useSharedValue(START);
  useEffect(() => {
    angle.value = START;
    angle.value = withDelay(200, withTiming(target, { duration: 1300, easing: Easing.out(Easing.cubic) }));
  }, [target, angle]);
  const pointer = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));

  const colors: Record<string, [string, string]> = {
    menstrual: [c.period, c.period],
    follicular: [c.follicular, c.follicular],
    ovulation: [c.fertile, c.ovulation],
    luteal: [c.luteal, c.luteal],
  };

  return (
    <View style={{ width, height, alignItems: 'center' }}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          {Object.entries(colors).map(([k, [a, b]]) => (
            <LinearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={a} />
              <Stop offset="1" stopColor={b} />
            </LinearGradient>
          ))}
          {/* Fades the two arc ends into the card at the bottom */}
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            {/* Long, eased fade: arcs dissolve into the card well before their ends */}
            <Stop offset="0" stopColor="#fff" stopOpacity={1} />
            <Stop offset={String((cy - r * 0.45) / height)} stopColor="#fff" stopOpacity={1} />
            <Stop offset={String((cy - r * 0.1) / height)} stopColor="#fff" stopOpacity={0.7} />
            <Stop offset={String((cy + r * 0.15) / height)} stopColor="#fff" stopOpacity={0.3} />
            <Stop offset={String((cy + r * 0.3) / height)} stopColor="#fff" stopOpacity={0.06} />
            <Stop offset="1" stopColor="#fff" stopOpacity={0} />
          </LinearGradient>
          <Mask id="fadeMask" x="0" y="0" width={width} height={height} maskUnits="userSpaceOnUse">
            <Rect x="0" y="0" width={width} height={height} fill="url(#fade)" />
          </Mask>
        </Defs>
        <G mask="url(#fadeMask)">
        {/* soft outer track */}
        <Path d={arcPath(cx, cy, r, START, START + SWEEP)} stroke={c.fill} strokeWidth={stroke + 12} strokeLinecap="round" fill="none" />
        {phaseSegments(avgCycle, avgPeriod).map((s) => {
          const a0 = START + ((s.from - 1) / avgCycle) * SWEEP + GAP / 2;
          const a1 = START + (s.to / avgCycle) * SWEEP - GAP / 2;
          const past = (cycleDay ?? 0) >= s.from;
          return (
            <Path
              key={s.key}
              d={arcPath(cx, cy, r, a0, Math.max(a0 + 0.5, a1))}
              stroke={`url(#g-${s.key})`}
              strokeOpacity={past ? 1 : 0.45}
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
            />
          );
        })}
        </G>
      </Svg>

      {/* Pointer: drawn at 0° (pointing right) then rotated around the centre */}
      {cycleDay != null && (
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width, height: width }, pointer]}>
          <Svg width={width} height={width} style={StyleSheet.absoluteFill}>
            <Path
              d={`M ${cx + r + stroke / 2 + 4} ${cy}
                  L ${cx + r - stroke - 10} ${cy - 13}
                  Q ${cx + r - stroke - 16} ${cy} ${cx + r - stroke - 10} ${cy + 13} Z`}
              fill={c.primary}
              stroke={c.surface}
              strokeWidth={3}
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      )}

      <View style={{ position: 'absolute', top: cy - r * 0.55, left: 0, right: 0, alignItems: 'center' }}>{children}</View>
    </View>
  );
}
