import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { ReactNode, useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { radius } from '../theme/tokens';
import { useColors, useIsDark } from '../theme/useTheme';

/** iOS 26+ real Liquid Glass; otherwise a frosted blur fallback. */
export const LIQUID_GLASS =
  Platform.OS === 'ios' && (() => {
    try {
      return isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
    } catch {
      return false;
    }
  })();

function useReduceTransparency() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled?.().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceTransparencyChanged', setReduce);
    return () => sub?.remove();
  }, []);
  return reduce;
}

type Props = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  interactive?: boolean;
  tint?: string;
  /** 'regular' = frosted card, 'clear' = more see-through (buttons over content) */
  variant?: 'regular' | 'clear';
};

export function Glass({ children, style, radius: r = radius.lg, interactive, tint, variant = 'regular' }: Props) {
  const c = useColors();
  const isDark = useIsDark();
  const reduce = useReduceTransparency();
  const shape = { borderRadius: r, borderCurve: 'continuous' as const };

  if (reduce) {
    return <View style={[shape, { backgroundColor: c.surface }, style]}>{children}</View>;
  }

  if (LIQUID_GLASS) {
    return (
      <GlassView glassEffectStyle={variant} isInteractive={interactive} tintColor={tint} style={[shape, style]}>
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[shape, styles.shadow, { shadowColor: c.shadow, shadowOpacity: isDark ? 0.5 : 0.07 }, style]}>
      <BlurView
        intensity={Platform.OS === 'android' ? 30 : 50}
        tint={isDark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={[StyleSheet.absoluteFill, shape, { overflow: 'hidden' }]}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          shape,
          {
            backgroundColor: tint ?? c.glassFallback,
            borderWidth: StyleSheet.hairlineWidth * 2,
            borderColor: c.glassBorder,
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
});
