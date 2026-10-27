import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useApp } from '../store/useAppStore';
import { predict } from './cycle';
import { todayISO } from './dates';
import { planReminders } from './reminderPlan';
import { applyReminders, onReminderOpened } from './reminders';

/**
 * Keeps scheduled notifications in step with the data: whenever reminder
 * settings or logs change (e.g. a new period moves the prediction), the plan
 * is rebuilt and rescheduled. Also routes notification taps.
 */
export function useReminderSync() {
  const ready = useApp((s) => s.ready);
  const reminders = useApp((s) => s.settings.reminders);
  const settings = useApp((s) => s.settings);
  const logs = useApp((s) => s.logs);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ready || !settings.onboarded) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const p = predict(logs, settings, todayISO());
      applyReminders(planReminders(reminders, p, new Date(), p.avgCycle)).catch(() => {});
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [ready, settings, reminders, logs]);

  useEffect(
    () =>
      onReminderOpened((url) => {
        if (url.startsWith('/log/')) router.push({ pathname: '/log/[date]', params: { date: todayISO() } });
        else router.navigate('/');
      }),
    []
  );
}
