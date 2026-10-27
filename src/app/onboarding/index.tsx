import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../../components/Background';
import { Glass } from '../../components/Glass';
import { Bloom, Icon } from '../../components/icons';
import { PrimaryButton, T } from '../../components/ui';
import { space } from '../../theme/tokens';
import { useColors } from '../../theme/useTheme';

export default function Welcome() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 24000, easing: Easing.linear }), -1);
  }, [spin]);
  const rot = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));

  return (
    <View style={{ flex: 1 }}>
      <Background />
      <View style={[styles.wrap, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
        <Animated.View entering={FadeInUp.duration(800)} style={{ alignItems: 'center', marginTop: 12 }}>
          <Animated.View style={rot}>
            <Bloom size={230} colors={[c.follicular, c.period, c.accent]} />
          </Animated.View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ gap: space.md }}>
          <T v="display">Your cycle,{'\n'}understood.</T>
          <T v="body" color={c.textSecondary}>
            Track your period, notice patterns in how you feel, and know what’s coming next.
          </T>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={{ gap: space.lg }}>
          <Glass style={styles.privacy}>
            <View style={[styles.lock, { backgroundColor: c.accentSoft }]}>
              <Icon name="lock" size={20} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="headline">Private by design</T>
              <T v="footnote" color={c.textSecondary}>No account. Your data stays encrypted on this device.</T>
            </View>
          </Glass>
          <PrimaryButton title="Get started" onPress={() => router.push('/onboarding/setup')} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: space.xl, justifyContent: 'space-between' },
  privacy: { flexDirection: 'row', gap: 12, padding: space.lg, alignItems: 'center' },
  lock: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
