/**
 * Haptic vocabulary, modelled on iOS system behaviour:
 * - tick:    picker wheel detents (like the Clock › Timer wheel), segmented controls, chips
 * - tap:     light impact for buttons
 * - thud:    medium impact for important toggles (period on/off)
 * - success: saving a log, finishing onboarding
 * - warning: destructive confirmation
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const safe = (fn: () => Promise<void>) => {
  fn().catch(() => {});
};

export const haptics = {
  tick: () =>
    safe(() =>
      Platform.OS === 'android'
        ? Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Frequent_Tick)
        : Haptics.selectionAsync()
    ),
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  soft: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)),
  thud: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
