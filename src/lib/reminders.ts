/**
 * Local notifications only — nothing is sent to a push server, and no
 * notification token is ever created.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { PlannedReminder } from './reminderPlan';

const CHANNEL = 'reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function permissionState(): Promise<PermissionState> {
  const s = await Notifications.getPermissionsAsync();
  if (s.granted || s.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'granted';
  return s.canAskAgain === false || s.status === 'denied' ? 'denied' : 'undetermined';
}

export async function ensurePermission(): Promise<PermissionState> {
  const now = await permissionState();
  if (now !== 'undetermined') return now;
  const r = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } });
  return r.granted || r.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ? 'granted' : 'denied';
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    // Hide content on the Android lock screen as well
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
}

export async function cancelAllReminders() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

/** Replace every scheduled reminder with the given plan. */
export async function applyReminders(plan: PlannedReminder[]) {
  await cancelAllReminders();
  if (!plan.length) return;
  if ((await permissionState()) !== 'granted') return;
  await ensureChannel();
  for (const r of plan) {
    await Notifications.scheduleNotificationAsync({
      identifier: r.id,
      content: { title: r.title, body: r.body, data: { url: r.url }, sound: 'default' },
      trigger:
        r.trigger.kind === 'daily'
          ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: r.trigger.hour, minute: r.trigger.minute, channelId: CHANNEL }
          : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.trigger.date, channelId: CHANNEL },
    });
  }
}

/** Calls `onOpen(url)` when the user taps one of our notifications. */
export function onReminderOpened(onOpen: (url: string) => void) {
  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const url = resp.notification.request.content.data?.url;
    if (typeof url === 'string') onOpen(url);
  });
  return () => sub.remove();
}
