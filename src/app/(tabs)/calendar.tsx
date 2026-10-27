import { addMonths, subMonths } from 'date-fns';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Chip } from '../../components/Chip';
import { Glass } from '../../components/Glass';
import { Icon } from '../../components/icons';
import { Legend, MonthCalendar, monthTitle } from '../../components/MonthCalendar';
import { GlassButton, PrimaryButton, Screen, T } from '../../components/ui';
import { moodOf, PHASES, symptomIcon, symptomLabel } from '../../lib/catalog';
import { dayKinds, predict } from '../../lib/cycle';
import { fmt, formatRange, todayISO } from '../../lib/dates';
import { haptics } from '../../lib/haptics';
import { useApp } from '../../store/useAppStore';
import { radius, space } from '../../theme/tokens';
import { useColors } from '../../theme/useTheme';

export default function CalendarScreen() {
  const c = useColors();
  const { logs, settings, togglePeriod } = useApp();
  const today = todayISO();
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState<string>(today);
  const [edit, setEdit] = useState(false);
  const kinds = useMemo(() => dayKinds(logs, settings, today, 12), [logs, settings, today]);
  const logged = useMemo(
    () => new Set(Object.values(logs).filter((l) => l.symptoms.length || l.moods.length || l.energy || l.notes).map((l) => l.date)),
    [logs]
  );
  const p = useMemo(() => predict(logs, settings, today), [logs, settings, today]);
  const sel = useMemo(() => predict(logs, settings, selected), [logs, settings, selected]);
  const selLog = logs[selected];

  const onDay = (d: string) => {
    if (edit) {
      if (d <= today) togglePeriod(d);
      return;
    }
    setSelected(d);
  };

  return (
    <Screen
      title="Calendar"
      right={
        edit ? (
          <GlassButton title="Done" filled onPress={() => { haptics.success(); setEdit(false); }} />
        ) : (
          <GlassButton title="Edit period" svg="pen" onPress={() => setEdit(true)} />
        )
      }
    >
      <View style={styles.monthBar}>
        <View style={[styles.calBadge, { backgroundColor: c.primary }]}>
          <Icon name="calendar" size={20} color={c.onPrimary} />
        </View>
        <Animated.View key={monthTitle(month)} entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={{ flex: 1 }}>
          <T v="title3">{monthTitle(month)}</T>
        </Animated.View>
        <GlassButton icon="chevron-back" compact onPress={() => setMonth((m) => subMonths(m, 1))} />
        <GlassButton icon="chevron-forward" compact onPress={() => setMonth((m) => addMonths(m, 1))} />
      </View>

      {edit && (
        <Animated.View entering={FadeInDown} exiting={FadeOut} style={[styles.editBanner, { backgroundColor: c.periodSoft }]}>
          <Icon name="dropFilled" size={18} color={c.period} />
          <T v="subhead" style={{ flex: 1 }}>Tap past days to mark or unmark your period.</T>
        </Animated.View>
      )}

      <Glass style={styles.card} radius={radius.xl}>
        <MonthCalendar month={month} kinds={kinds} logged={logged} today={today} selected={edit ? null : selected} onPressDay={onDay} editMode={edit} />
      </Glass>

      <Legend />

      {!edit && (
        <Animated.View layout={LinearTransition} key={selected} entering={FadeInDown.duration(300)}>
          <Glass style={styles.card} radius={radius.xl}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <T v="title3">{selected === today ? 'Today' : fmt(selected, 'EEEE')}, {fmt(selected, 'd MMMM')}</T>
                {sel.cycleDay && sel.phase && (
                  <T v="subhead" color={c.textSecondary}>Day {sel.cycleDay} — {PHASES[sel.phase].label}</T>
                )}
              </View>
              {kinds[selected] && (
                <View style={[styles.kindPill, { backgroundColor: kinds[selected] === 'period' || kinds[selected] === 'predictedPeriod' ? c.periodSoft : c.fertileSoft }]}>
                  <T v="caption" color={c.text}>
                    {{ period: 'Period', predictedPeriod: 'Predicted', fertile: 'Fertile', ovulation: 'Ovulation' }[kinds[selected]!]}
                  </T>
                </View>
              )}
            </View>

            <T v="overline" color={c.textSecondary}>Logged data</T>
            {selLog && (selLog.symptoms.length || selLog.moods.length || selLog.flow || selLog.notes) ? (
              <View style={styles.wrap}>
                {selLog.flow && <Chip label={`${selLog.flow[0].toUpperCase()}${selLog.flow.slice(1)} flow`} icon="dropFilled" selected={false} onPress={() => {}} />}
                {selLog.moods.map((m) => <Chip key={m} label={moodOf(m)?.label ?? m} emoji={moodOf(m)?.emoji} selected={false} onPress={() => {}} />)}
                {selLog.symptoms.map((s) => <Chip key={s} label={symptomLabel(s)} icon={symptomIcon(s)} selected={false} onPress={() => {}} />)}
                {selLog.notes ? <T v="subhead" color={c.textSecondary} style={{ width: '100%' }}>“{selLog.notes}”</T> : null}
              </View>
            ) : (
              <T v="subhead" color={c.textSecondary}>{selected > today ? 'You can log this day when it comes.' : 'Nothing logged for this day.'}</T>
            )}
            {selected <= today && (
              <PrimaryButton title={selLog ? 'Edit this day' : 'Log this day'} icon="pen" onPress={() => router.push({ pathname: '/log/[date]', params: { date: selected } })} />
            )}
          </Glass>
        </Animated.View>
      )}

      {p.nextRange && (
        <Glass style={[styles.card, { gap: space.sm }]} radius={radius.xl}>
          <Row label="Next period" value={formatRange(p.nextRange[0], p.nextRange[1])} color={c.period} />
          {p.fertile && <Row label="Fertile window" value={formatRange(p.fertile[0], p.fertile[1])} color={c.fertile} />}
          {p.ovulation && <Row label="Ovulation (estimate)" value={fmt(p.ovulation, 'MMM d')} color={c.ovulation} />}
          <T v="footnote" color={c.textSecondary}>Estimates only — not for contraception.</T>
        </Glass>
      )}
    </Screen>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 5, height: 30, borderRadius: 3, backgroundColor: color }} />
      <T v="callout" style={{ flex: 1, fontWeight: '500' }}>{label}</T>
      <T v="callout" color={c.textSecondary} style={{ fontVariant: ['tabular-nums'] }}>{value}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg, gap: space.md },
  monthBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  calBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  editBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: space.md, borderRadius: 18 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kindPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
});
