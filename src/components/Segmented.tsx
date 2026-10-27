import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { haptics } from '../lib/haptics';
import { useColors, useIsDark } from '../theme/useTheme';
import { T } from './ui';

type Option<K extends string> = { id: K; label: string };

/**
 * iOS segmented control: sliding thumb with spring + selection haptic.
 * `allowNone` lets the user tap the active segment again to clear it.
 */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
  allowNone,
  activeColor,
}: {
  options: Option<K>[];
  value: K | undefined;
  onChange: (v: K | undefined) => void;
  allowNone?: boolean;
  activeColor?: string;
}) {
  const c = useColors();
  const isDark = useIsDark();
  const [w, setW] = useState(0);
  const idx = options.findIndex((o) => o.id === value);
  const segW = w / options.length;

  const thumb = useAnimatedStyle(() => ({
    opacity: withSpring(idx < 0 ? 0 : 1),
    transform: [{ translateX: withSpring(Math.max(idx, 0) * segW, { damping: 22, stiffness: 260 }) }],
  }));

  return (
    <View
      style={[styles.track, { backgroundColor: c.fill }]}
      onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width - 4)}
      accessibilityRole="tablist"
    >
      {w > 0 && (
        <Animated.View
          style={[
            styles.thumb,
            { width: segW, backgroundColor: activeColor ?? (isDark ? c.fillStrong : '#FFFFFF') },
            thumb,
          ]}
        />
      )}
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable
            key={o.id}
            style={styles.seg}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (active && !allowNone) return;
              haptics.tick();
              onChange(active ? undefined : o.id);
            }}
          >
            <T v="subhead" style={{ fontWeight: active ? '600' : '500' }} color={active && activeColor ? '#fff' : c.text}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: 12, padding: 2, height: 38 },
  thumb: {
    position: 'absolute',
    top: 2,
    left: 2,
    bottom: 2,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  seg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
