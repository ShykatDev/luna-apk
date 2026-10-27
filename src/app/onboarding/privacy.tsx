import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../../components/Background';
import { Glass } from '../../components/Glass';
import { Icon, IconName } from '../../components/icons';
import { PrimaryButton, T } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { space } from '../../theme/tokens';
import { useColors } from '../../theme/useTheme';

const POINTS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'phone', title: 'Stays on your device', body: 'Your logs live only on this phone, encrypted with a key kept in the secure keychain.' },
  { icon: 'eyeOff', title: 'No ads. No trackers.', body: 'No analytics SDKs, no data selling, no account required.' },
  { icon: 'trash', title: 'You’re in control', body: 'Permanently delete everything at any time from Settings.' },
];

export default function PrivacyPromise() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <Background />
      <View style={[styles.wrap, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 16 }]}>
        <View style={{ gap: space.xl }}>
          <Animated.View entering={ZoomIn.springify().damping(14)} style={[styles.badge, { backgroundColor: c.primary }]}>
            <Icon name="shield" size={40} color={c.onPrimary} />
          </Animated.View>
          <T v="largeTitle">Your privacy is the product.</T>
          <Glass style={{ padding: space.lg, gap: space.lg }}>
            {POINTS.map((p, i) => (
              <Animated.View key={p.title} entering={FadeInDown.delay(150 + i * 120)} style={{ flexDirection: 'row', gap: 14 }}>
                <View style={[styles.pointIcon, { backgroundColor: c.accentSoft }]}>
                  <Icon name={p.icon} size={22} color={c.accent} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="headline">{p.title}</T>
                  <T v="subhead" color={c.textSecondary}>{p.body}</T>
                </View>
              </Animated.View>
            ))}
          </Glass>
        </View>
        <PrimaryButton
          title="I understand"
          onPress={() => {
            haptics.success();
            router.replace('/');
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: space.xl, justifyContent: 'space-between' },
  badge: { width: 84, height: 84, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  pointIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
