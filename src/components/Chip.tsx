import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { radius } from '../theme/tokens';
import { useColors, useIsDark } from '../theme/useTheme';
import { Icon, IconName } from './icons';
import { PressScale, T } from './ui';

/** Pill chip (moods, summaries). Selected = filled plum with a drawn check. */
export function Chip({
  label,
  selected,
  onPress,
  icon,
  emoji,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  emoji?: string;
}) {
  const c = useColors();
  const isDark = useIsDark();
  const on = c.onPrimary;
  const check = useAnimatedStyle(() => ({
    width: withSpring(selected ? 14 : 0, { damping: 18, stiffness: 300 }),
    opacity: withTiming(selected ? 1 : 0, { duration: 150 }),
  }));
  return (
    <PressScale haptic="tick" onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={label}>
      <View
        style={[
          styles.chip,
          selected
            ? { backgroundColor: c.primary, borderColor: c.primary }
            : { backgroundColor: isDark ? c.fill : 'rgba(255,255,255,0.6)', borderColor: isDark ? c.separator : 'rgba(255,255,255,1)' },
        ]}
      >
        {emoji ? <Text style={{ fontSize: 16 }}>{emoji}</Text> : icon ? <Icon name={icon} size={17} color={selected ? on : c.period} /> : null}
        <T v="subhead" color={selected ? on : c.text} style={{ fontWeight: '500' }}>{label}</T>
        <Animated.View style={[{ overflow: 'hidden', alignItems: 'flex-end' }, check]}>
          <Svg width={14} height={14} viewBox="0 0 14 14">
            <Path d="M2.5 7.5l3 3 6-7" stroke={on} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        </Animated.View>
      </View>
    </PressScale>
  );
}

/** Square tile with a custom SVG icon in a soft circle (symptoms). */
export function IconTile({
  label,
  icon,
  selected,
  onPress,
  tint,
}: {
  label: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
  tint?: string;
}) {
  const c = useColors();
  const isDark = useIsDark();
  const accent = tint ?? c.period;
  return (
    <PressScale haptic="tick" onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={label} style={{ flex: 1 }}>
      <View
        style={[
          styles.tile,
          selected
            ? { backgroundColor: c.primary, borderColor: c.primary }
            : { backgroundColor: isDark ? c.fill : 'rgba(255,255,255,0.6)', borderColor: isDark ? c.separator : '#FFFFFF' },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: selected ? 'rgba(255,255,255,0.16)' : c.periodSoft }]}>
          <Icon name={icon} size={24} color={selected ? c.onPrimary : accent} />
        </View>
        <T v="caption" color={selected ? c.onPrimary : c.text} style={{ textAlign: 'center' }} numberOfLines={2}>{label}</T>
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 40, borderRadius: radius.pill, borderWidth: 1 },
  tile: { alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 20, borderWidth: 1, minHeight: 104 },
  iconCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
