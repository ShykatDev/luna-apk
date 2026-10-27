import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, G, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useColors, useIsDark } from '../theme/useTheme';

/**
 * Soft aurora + a large faint bloom in the corner (like the petal backdrop in
 * the references). Glass needs colour behind it to read as glass.
 */
export function Background() {
  const c = useColors();
  const isDark = useIsDark();
  const k = isDark ? 0.45 : 1;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.background }]} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="a" cx="10%" cy="6%" r="65%">
            <Stop offset="0" stopColor={c.blobA} stopOpacity={0.95 * k} />
            <Stop offset="1" stopColor={c.blobA} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="b" cx="100%" cy="28%" r="60%">
            <Stop offset="0" stopColor={c.blobB} stopOpacity={0.85 * k} />
            <Stop offset="1" stopColor={c.blobB} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="c" cx="0%" cy="92%" r="60%">
            <Stop offset="0" stopColor={c.blobC} stopOpacity={0.7 * k} />
            <Stop offset="1" stopColor={c.blobC} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#a)" />
        <Rect width="100%" height="100%" fill="url(#b)" />
        <Rect width="100%" height="100%" fill="url(#c)" />
      </Svg>
      {/* Decorative bloom, top-right, bleeding off-screen */}
      <Svg width={340} height={340} viewBox="0 0 200 200" style={{ position: 'absolute', top: -90, right: -120, opacity: isDark ? 0.35 : 0.55 }}>
        <G>
          {Array.from({ length: 7 }, (_, i) => (
            <Ellipse key={i} cx={100} cy={48} rx={26} ry={48} fill={c.petal} transform={`rotate(${(i * 360) / 7} 100 100)`} />
          ))}
        </G>
      </Svg>
    </View>
  );
}
