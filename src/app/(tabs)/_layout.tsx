import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useApp } from '../../store/useAppStore';
import { useColors } from '../../theme/useTheme';

/**
 * Native system tab bar → on iOS 26 this is the real Liquid Glass tab bar,
 * minimising on scroll like Apple's own apps.
 */
export default function TabsLayout() {
  const onboarded = useApp((s) => s.settings.onboarded);
  const c = useColors();
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <NativeTabs minimizeBehavior="onScrollDown" tintColor={c.accent} labelStyle={{ color: c.textSecondary }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'circle.dashed', selected: 'circle.dashed.inset.filled' }} md="radio_button_checked" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.Label>Calendar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="insights">
        <NativeTabs.Trigger.Label>Insights</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} md="bar_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
