/**
 * Web preview only: browsers have no system tab bar, so we draw a floating
 * glass capsule that mimics the iOS 26 tab bar. iOS/Android use NativeTabs.
 */
import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';
import { Glass } from '../../components/Glass';
import { T } from '../../components/ui';
import { haptics } from '../../lib/haptics';
import { useApp } from '../../store/useAppStore';
import { useColors } from '../../theme/useTheme';

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap, string]> = {
  index: ['ellipse-outline', 'ellipse', 'Today'],
  calendar: ['calendar-outline', 'calendar', 'Calendar'],
  insights: ['bar-chart-outline', 'bar-chart', 'Insights'],
  settings: ['settings-outline', 'settings', 'Settings'],
};

export default function TabsLayoutWeb() {
  const onboarded = useApp((s) => s.settings.onboarded);
  const c = useColors();
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
      tabBar={({ state, navigateToTab }) => (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 20 }}>
          <Glass radius={999} style={{ flexDirection: 'row', padding: 4 }}>
            {state.routes.map((r, i) => {
              const active = state.index === i;
              const [icon, iconActive, label] = ICONS[r.name] ?? ['ellipse', 'ellipse', r.name];
              return (
                <Pressable
                  key={r.key}
                  onPress={() => {
                    haptics.tick();
                    navigateToTab(r.key);
                  }}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: active ? c.fill : 'transparent',
                  }}
                >
                  <Ionicons name={active ? iconActive : icon} size={22} color={active ? c.accent : c.textSecondary} />
                  <T v="caption" color={active ? c.accent : c.textSecondary} style={{ fontSize: 10 }}>
                    {label}
                  </T>
                </Pressable>
              );
            })}
          </Glass>
        </View>
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="insights" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
