import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Linking, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Glass } from '../components/Glass';
import { Bloom, Icon, IconName } from '../components/icons';
import { Segmented } from '../components/Segmented';
import { GlassButton, PressScale, Screen, T, Toggle } from '../components/ui';
import { WheelPicker } from '../components/WheelPicker';
import { ReminderSettings, TimeOfDay } from '../data/types';
import { DISCREET, timeLabel } from '../lib/reminderPlan';
import { ensurePermission, permissionState, PermissionState } from '../lib/reminders';
import { useApp } from '../store/useAppStore';
import { radius, space } from '../theme/tokens';
import { useColors } from '../theme/useTheme';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const pad2 = (n: number) => String(n).padStart(2, '0');

type Key = 'periodSoon' | 'fertile' | 'dailyLog' | 'pill';

const ITEMS: { key: Key; icon: IconName; title: string; sub: string; explicitTitle: string }[] = [
  { key: 'periodSoon', icon: 'dropFilled', title: 'Period coming up', sub: 'A heads-up before your predicted period', explicitTitle: 'Period expected in 2 days' },
  { key: 'fertile', icon: 'sparkle', title: 'Fertile window', sub: 'On the first estimated fertile day', explicitTitle: 'Fertile window starts today' },
  { key: 'dailyLog', icon: 'pen', title: 'Daily check-in', sub: 'A nudge to log how you feel', explicitTitle: 'How are you feeling today?' },
  { key: 'pill', icon: 'shield', title: 'Pill reminder', sub: 'Same time every day', explicitTitle: 'Pill reminder' },
];

export default function Reminders() {
  const c = useColors();
  const r = useApp((s) => s.settings.reminders);
  const updateSettings = useApp((s) => s.updateSettings);
  const [perm, setPerm] = useState<PermissionState>('undetermined');
  const [open, setOpen] = useState<Key | null>(null);

  useEffect(() => {
    const check = () => permissionState().then(setPerm).catch(() => {});
    check();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => sub.remove();
  }, []);

  const save = (patch: Partial<ReminderSettings>) => updateSettings({ reminders: { ...r, ...patch } });

  const toggle = async (key: Key, on: boolean) => {
    if (on) {
      const p = await ensurePermission();
      setPerm(p);
      if (p !== 'granted') return;
    }
    save({ [key]: { ...r[key], enabled: on } } as Partial<ReminderSettings>);
    setOpen(on ? key : null);
  };

  const setTime = (key: Key, t: Partial<TimeOfDay>) => save({ [key]: { ...r[key], time: { ...r[key].time, ...t } } } as Partial<ReminderSettings>);

  const sample = ITEMS.find((i) => r[i.key].enabled) ?? ITEMS[2];

  return (
    <Screen title="Reminders" right={<GlassButton icon="close" compact onPress={() => router.back()} />}>
      {/* Live preview of how a notification will look on the lock screen */}
      <View style={{ gap: 8 }}>
        <T v="overline" color={c.textSecondary}>Lock screen preview</T>
        <Glass style={styles.banner} radius={22}>
          <View style={[styles.appIcon, { backgroundColor: c.surface }]}>
            <Bloom size={30} colors={[c.follicular, c.period, c.accent]} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T v="subhead" style={{ fontWeight: '600' }}>{r.discreet ? DISCREET.title : sample.explicitTitle}</T>
              <T v="caption" color={c.textSecondary}>now</T>
            </View>
            <T v="subhead" color={c.textSecondary} numberOfLines={2}>
              {r.discreet ? DISCREET.daily : sample.key === 'periodSoon' ? 'Based on your cycle it may start around Nov 16.' : sample.sub}
            </T>
          </View>
        </Glass>
      </View>

      {perm === 'denied' && (
        <Animated.View entering={FadeIn}>
          <Glass style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]} tint={c.periodSoft}>
            <Icon name="bell" size={22} color={c.period} />
            <T v="subhead" style={{ flex: 1 }}>Notifications are off for Luna. Turn them on in your phone’s settings.</T>
            {Platform.OS !== 'web' && <GlassButton title="Open" onPress={() => Linking.openSettings()} />}
          </Glass>
        </Animated.View>
      )}

      <Glass style={[styles.card, styles.row]}>
        <View style={[styles.icon, { backgroundColor: c.accentSoft }]}>
          <Icon name="eyeOff" size={20} color={c.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="headline">Discreet notifications</T>
          <T v="footnote" color={c.textSecondary}>Generic wording, so nothing about your cycle shows on the lock screen.</T>
        </View>
        <Toggle label="Discreet notifications" value={r.discreet} onChange={(v) => save({ discreet: v })} activeColor={c.accent} />
      </Glass>

      <Animated.View layout={LinearTransition} style={{ gap: space.md }}>
        {ITEMS.map((it) => {
          const cfg = r[it.key];
          const expanded = cfg.enabled && open === it.key;
          return (
            <Animated.View key={it.key} layout={LinearTransition}>
              <Glass style={styles.card} radius={radius.lg}>
                <View style={styles.row}>
                  <View style={[styles.icon, { backgroundColor: it.key === 'periodSoon' ? c.periodSoft : it.key === 'fertile' ? c.fertileSoft : c.accentSoft }]}>
                    <Icon name={it.icon} size={20} color={it.key === 'periodSoon' ? c.period : it.key === 'fertile' ? c.ovulation : c.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T v="headline">{it.title}</T>
                    <T v="footnote" color={c.textSecondary}>{it.sub}</T>
                  </View>
                  <Toggle label={it.title} value={cfg.enabled} onChange={(v) => toggle(it.key, v)} />
                </View>

                {cfg.enabled && (
                  <PressScale haptic="tick" onPress={() => setOpen(expanded ? null : it.key)} accessibilityRole="button" accessibilityLabel={`Change time, currently ${timeLabel(cfg.time)}`}>
                    <View style={[styles.timeRow, { backgroundColor: c.fill }]}>
                      <T v="subhead" color={c.textSecondary}>
                        {it.key === 'periodSoon' ? `${r.periodSoon.daysBefore} day${r.periodSoon.daysBefore > 1 ? 's' : ''} before · ` : it.key === 'fertile' ? 'On the day · ' : 'Every day · '}
                      </T>
                      <T v="headline" color={c.accent}>{timeLabel(cfg.time)}</T>
                    </View>
                  </PressScale>
                )}

                {expanded && (
                  <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)} style={{ gap: space.md }}>
                    {it.key === 'periodSoon' && (
                      <Segmented<'1' | '2' | '3'>
                        options={[{ id: '1', label: '1 day before' }, { id: '2', label: '2 days' }, { id: '3', label: '3 days' }]}
                        value={String(r.periodSoon.daysBefore) as '1' | '2' | '3'}
                        onChange={(v) => v && save({ periodSoon: { ...r.periodSoon, daysBefore: Number(v) as 1 | 2 | 3 } })}
                      />
                    )}
                    <TimeWheels value={cfg.time} onChange={(t) => setTime(it.key, t)} />
                  </Animated.View>
                )}
              </Glass>
            </Animated.View>
          );
        })}
      </Animated.View>

      <T v="footnote" color={c.textSecondary} style={{ paddingHorizontal: space.sm }}>
        Reminders are scheduled on this phone only. Luna never uses push servers, so no one else can see or send them.
      </T>
    </Screen>
  );
}

/** Clock-Timer style: hour + minute wheels under one shared selection band, haptic detents. */
function TimeWheels({ value, onChange }: { value: TimeOfDay; onChange: (t: Partial<TimeOfDay>) => void }) {
  const c = useColors();
  return (
    <View style={styles.wheels}>
      <View pointerEvents="none" style={[styles.sharedBand, { backgroundColor: c.fill }]} />
      <WheelPicker values={HOURS} value={value.hour} onChange={(h) => onChange({ hour: h })} format={pad2} width={90} hideBand accessibilityLabel="Hour" />
      <T v="title2" style={{ marginTop: -4 }}>:</T>
      <WheelPicker values={MINUTES} value={Math.round(value.minute / 5) * 5 % 60} onChange={(m) => onChange({ minute: m })} format={pad2} width={90} hideBand accessibilityLabel="Minute" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  banner: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'center' },
  appIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 10 },
  wheels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  sharedBand: { position: 'absolute', left: 30, right: 30, height: 40, top: 80, borderRadius: 10 },
});

