/** Browsers don't get scheduled local notifications — web preview is a no-op. */
import type { PlannedReminder } from './reminderPlan';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function permissionState(): Promise<PermissionState> {
  return 'granted';
}
export async function ensurePermission(): Promise<PermissionState> {
  return 'granted';
}
export async function cancelAllReminders() {}
export async function applyReminders(_plan: PlannedReminder[]) {}
export function onReminderOpened(_onOpen: (url: string) => void) {
  return () => {};
}
