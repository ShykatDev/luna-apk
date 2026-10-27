import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useEffect } from 'react';
import {
  Pressable,
  PressableProps,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '../lib/haptics';
import { font, radius, space, type } from '../theme/tokens';
import { useColors } from '../theme/useTheme';
import { Background } from './Background';
import { Glass } from './Glass';
import { Icon, IconName } from './icons';

type Variant = keyof typeof type;

const WEIGHT_TO_FAMILY: Record<string, string> = {
  '300': font.regular, '400': font.regular, normal: font.regular,
  '500': font.medium, '600': font.semibold, '700': font.bold, bold: font.bold, '800': font.bold,
};

/** Text with the Poppins scale. Any `fontWeight` is mapped to the matching Poppins file. */
export function T({ v = 'body', color, style, ...rest }: TextProps & { v?: Variant; color?: string; style?: StyleProp<TextStyle> }) {
  const c = useColors();
  const flat = StyleSheet.flatten(style) ?? {};
  const { fontWeight, ...restStyle } = flat;
  const family = fontWeight ? WEIGHT_TO_FAMILY[String(fontWeight)] : undefined;
  // Poppins has tall ascenders: if a size is overridden without a line height, give it room so it never clips
  const lh = restStyle.fontSize && !restStyle.lineHeight ? { lineHeight: Math.ceil(restStyle.fontSize * 1.28) } : null;
  return <Text {...rest} style={[type[v], { color: color ?? c.text }, restStyle, lh, family ? { fontFamily: family } : null]} />;
}

/** Spring-scale press feedback used across tappable surfaces. */
export function PressScale({
  children,
  onPress,
  style,
  haptic = 'tap',
  disabled,
  fill,
  ...rest
}: PressableProps & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: keyof typeof haptics | null;
  /** Stretch to share a row equally with siblings (flex: 1 on both the touch target and its content). */
  fill?: boolean;
}) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={fill ? { flex: 1 } : undefined}
      onPressIn={() => (s.value = withSpring(0.95, { damping: 20, stiffness: 420 }))}
      onPressOut={() => (s.value = withSpring(1, { damping: 14, stiffness: 300 }))}
      onPress={(e) => {
        if (haptic) haptics[haptic]();
        onPress?.(e);
      }}
    >
      <Animated.View style={[fill && { flex: 1 }, a, style, disabled && { opacity: 0.4 }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function PrimaryButton({
  title,
  onPress,
  icon,
  disabled,
  tone = 'primary',
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  disabled?: boolean;
  tone?: 'primary' | 'period' | 'danger';
}) {
  const c = useColors();
  const bg = tone === 'danger' ? c.danger : tone === 'period' ? c.period : c.primary;
  const fg = tone === 'danger' ? '#fff' : tone === 'period' ? c.onPeriod : c.onPrimary;
  return (
    <PressScale onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={title}>
      <View style={[styles.primary, { backgroundColor: bg, shadowColor: bg }]}>
        {icon && <Icon name={icon} size={20} color={fg} strokeWidth={2} />}
        <T v="headline" color={fg}>{title}</T>
      </View>
    </PressScale>
  );
}

/** Capsule glass button, like iOS 26 toolbar buttons. */
export function GlassButton({
  title,
  icon,
  svg,
  onPress,
  color,
  compact,
  filled,
}: {
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  svg?: IconName;
  onPress: () => void;
  color?: string;
  compact?: boolean;
  filled?: boolean;
}) {
  const c = useColors();
  const fg = filled ? c.onPrimary : color ?? c.text;
  const inner = (
    <>
      {icon && <Ionicons name={icon} size={compact ? 20 : 17} color={fg} />}
      {svg && <Icon name={svg} size={18} color={fg} />}
      {title && <T v="subhead" color={fg} style={{ fontWeight: '600' }}>{title}</T>}
    </>
  );
  const box = [styles.glassBtn, compact && { paddingHorizontal: 0, width: 44, justifyContent: 'center' as const }];
  return (
    <PressScale onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      {filled ? (
        <View style={[box, { backgroundColor: c.primary, borderRadius: radius.pill }]}>{inner}</View>
      ) : (
        <Glass radius={radius.pill} interactive style={box}>{inner}</Glass>
      )}
    </PressScale>
  );
}

/**
 * Custom toggle: plum/orchid track, white thumb on a spring, haptic thud.
 * Replaces the platform Switch so it looks the same everywhere.
 */
export function Toggle({ value, onChange, label, activeColor }: { value: boolean; onChange: (v: boolean) => void; label: string; activeColor?: string }) {
  const c = useColors();
  const on = activeColor ?? c.period;
  const p = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(value ? 1 : 0, { damping: 18, stiffness: 260 });
  }, [value, p]);
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [c.toggleOff, on]) }));
  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: p.value * 22 }, { scaleX: 1 + Math.sin(p.value * Math.PI) * 0.18 }],
  }));
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      onPress={() => {
        haptics.thud();
        onChange(!value);
      }}
    >
      <Animated.View style={[styles.toggle, track]}>
        <Animated.View style={[styles.thumb, thumb]} />
      </Animated.View>
    </Pressable>
  );
}

/** Scrollable screen with a large title on the soft background. */
export function Screen({
  title,
  overline,
  subtitle,
  right,
  children,
}: {
  title?: string;
  overline?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  return (
    <View style={{ flex: 1 }}>
      <Background />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + space.md, paddingBottom: insets.bottom + 120, paddingHorizontal: space.lg, gap: space.lg }}
        showsVerticalScrollIndicator={false}
      >
        {(title || right) && (
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              {overline && <T v="overline" color={c.textSecondary}>{overline}</T>}
              {title && <T v="largeTitle" accessibilityRole="header">{title}</T>}
              {subtitle && <T v="subhead" color={c.textSecondary}>{subtitle}</T>}
            </View>
            {right}
          </View>
        )}
        {children}
      </ScrollView>
    </View>
  );
}

export function SectionTitle({ children, action }: { children: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionTitle}>
      <T v="title3">{children}</T>
      {action}
    </View>
  );
}

/** iOS inset-grouped list on glass */
export function ListGroup({ children, header, footer }: { children: ReactNode; header?: string; footer?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      {header && <T v="overline" color={c.textSecondary} style={{ marginLeft: space.lg }}>{header}</T>}
      <Glass radius={radius.md} style={{ overflow: 'hidden' }}>{children}</Glass>
      {footer && <T v="footnote" color={c.textSecondary} style={{ marginHorizontal: space.lg }}>{footer}</T>}
    </View>
  );
}

export function ListRow({
  icon,
  iconBg,
  title,
  value,
  onPress,
  last,
  destructive,
  right,
  subtitle,
}: {
  icon?: IconName;
  iconBg?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
  destructive?: boolean;
  right?: ReactNode;
}) {
  const c = useColors();
  const body = (
    <View style={styles.row}>
      {icon && (
        <View style={[styles.rowIcon, { backgroundColor: iconBg ?? c.accent }]}>
          <Icon name={icon} size={17} color="#fff" strokeWidth={2} />
        </View>
      )}
      <View style={[styles.rowBody, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.separator }]}>
        <View style={{ flex: 1 }}>
          <T v="callout" color={destructive ? c.danger : c.text} style={{ fontWeight: '500' }}>{title}</T>
          {subtitle && <T v="footnote" color={c.textSecondary}>{subtitle}</T>}
        </View>
        {value && <T v="callout" color={c.textSecondary}>{value}</T>}
        {right}
        {onPress && !destructive && <Ionicons name="chevron-forward" size={18} color={c.textTertiary} />}
      </View>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={() => { haptics.tap(); onPress(); }} style={({ pressed }) => pressed && { backgroundColor: c.fill }} accessibilityRole="button">
      {body}
    </Pressable>
  );
}

export function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <T v="caption" color={color} style={{ fontWeight: '600' }}>{label}</T>
    </View>
  );
}

export function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />;
}

/** Fade helper for conditionally-shown blocks. */
export function useFade(visible: boolean) {
  const o = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    o.value = withTiming(visible ? 1 : 0, { duration: 200 });
  }, [visible, o]);
  return useAnimatedStyle(() => ({ opacity: o.value }));
}

const styles = StyleSheet.create({
  primary: {
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 24,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  glassBtn: { height: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md, marginBottom: space.xs },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: space.lg, minHeight: 54 },
  rowIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: space.md },
  rowBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: space.lg, paddingVertical: 12, minHeight: 54 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  toggle: { width: 52, height: 30, borderRadius: 15, padding: 3, justifyContent: 'center' },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
