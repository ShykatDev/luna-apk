import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArcGauge } from '../../components/ArcGauge';
import { Chip } from '../../components/Chip';
import { Glass } from '../../components/Glass';
import { Icon, IconName } from '../../components/icons';
import { PhaseStrip } from '../../components/PhaseStrip';
import { Dot, GlassButton, Pill, PressScale, PrimaryButton, Screen, SectionTitle, T } from '../../components/ui';
import { WeekStrip } from '../../components/WeekStrip';
import { moodOf, PHASES, symptomIcon, symptomLabel } from '../../lib/catalog';
import { dayKinds, predict } from '../../lib/cycle';
import { diffDays, fmt, formatRange, todayISO } from '../../lib/dates';
import { haptics } from '../../lib/haptics';
import { useApp } from '../../store/useAppStore';
import { radius, space } from '../../theme/tokens';
import { useColors } from '../../theme/useTheme';

const CONF = { low: 'Low confidence', medium: 'Medium confidence', high: 'High confidence' } as const;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Today() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const { logs, settings, togglePeriod } = useApp();
  const today = todayISO();
  const p = useMemo(() => predict(logs, settings, today), [logs, settings, today]);
  const kinds = useMemo(() => dayKinds(logs, settings, today), [logs, settings, today]);
  const logged = useMemo(
    () => new Set(Object.values(logs).filter((l) => l.symptoms.length || l.moods.length || l.energy || l.notes).map((l) => l.date)),
    [logs]
  );
  const todayLog = logs[today];
  const onPeriodToday = !!todayLog?.period;

  const headline = !p.hasData
    ? 'Log your period to begin'
    : p.daysLate > 0
      ? `Period is ${p.daysLate} day${p.daysLate > 1 ? 's' : ''} late`
      : onPeriodToday
        ? 'You’re on your period'
        : p.daysUntilNext! <= 0
          ? 'Period may start today'
          : `Period in ${p.daysUntilNext} day${p.daysUntilNext === 1 ? '' : 's'}`;

  const fertileStatus = (() => {
    if (!p.fertile) return { value: '—', sub: 'Not enough data' };
    const [a, b] = p.fertile;
    if (today >= a && today <= b) return { value: 'Now', sub: 'Fertile window' };
    if (today < a) return { value: `${diffDays(a, today)}d`, sub: 'Until fertile window' };
    return { value: 'Done', sub: 'Window passed' };
  })();

  const openLog = (d = today) => router.push({ pathname: '/log/[date]', params: { date: d } });
  const onTogglePeriod = async () => {
    const on = await togglePeriod(today);
    on ? haptics.success() : haptics.thud();
  };

  const phaseColor = { menstrual: c.period, follicular: c.follicular, ovulation: c.fertile, luteal: c.luteal } as const;

  const legend: [string, string][] = [
    [c.period, 'Menstruation'],
    [c.follicular, 'Follicular'],
    [c.fertile, 'Ovulation'],
    [c.luteal, 'Luteal'],
  ];

  return (
    <Screen
      overline={fmt(today, 'EEEE, d MMMM')}
      title={settings.name ? `${greeting()},\n${settings.name}` : greeting()}
      subtitle={p.hasData ? (p.daysLate > 0 ? 'Your cycle is running a little long' : 'Your cycle is on track') : undefined}
      right={<GlassButton svg="plus" compact onPress={() => openLog()} />}
    >
      <WeekStrip today={today} kinds={kinds} logged={logged} onPressDay={openLog} />

      <Animated.View entering={FadeInDown.duration(500)}>
        <Glass style={styles.hero} radius={radius.xl}>
          <View style={{ alignItems: 'center' }}>
            <ArcGauge width={Math.min(width - 72, 330)} cycleDay={p.cycleDay} avgCycle={p.avgCycle} avgPeriod={p.avgPeriod}>
              {p.cycleDay ? (
                <>
                  <T v="display" style={{ fontSize: 48, lineHeight: 56 }}>Day {p.cycleDay}</T>
                  {p.phase && (
                    <View style={[styles.phasePill, { backgroundColor: `${phaseColor[p.phase]}26` }]}>
                      <Dot color={phaseColor[p.phase]} size={8} />
                      <T v="subhead" color={c.phaseText[p.phase]} style={{ fontWeight: '600' }}>{PHASES[p.phase].label}</T>
                    </View>
                  )}
                </>
              ) : (
                <Icon name="dropFilled" size={44} color={c.period} />
              )}
            </ArcGauge>
          </View>

          <View style={styles.legend}>
            {legend.map(([col, l]) => (
              <View key={l} style={styles.legendItem}>
                <Dot color={col} size={10} />
                <T v="footnote" color={c.textSecondary}>{l}</T>
              </View>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: c.separator }]} />

          <View style={{ gap: 4 }}>
            <T v="title2">{headline}</T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {p.nextRange && !onPeriodToday && <T v="subhead" color={c.textSecondary}>Expected {formatRange(p.nextRange[0], p.nextRange[1])}</T>}
              {p.hasData && <Pill label={CONF[p.confidence]} color={c.text} bg={c.accentSoft} />}
            </View>
          </View>

          <View style={{ gap: 10 }}>
            <PrimaryButton title="Log your symptoms" icon="sparkle" onPress={() => openLog()} />
            <PressScale haptic={null} onPress={onTogglePeriod} accessibilityRole="button" accessibilityLabel={onPeriodToday ? 'Undo period today' : 'Period started today'}>
              <View style={[styles.secondary, { borderColor: `${c.period}4D`, backgroundColor: onPeriodToday ? c.periodSoft : 'transparent' }]}>
                <Icon name={onPeriodToday ? 'dropFilled' : 'drop'} size={20} color={c.period} strokeWidth={2} />
                <T v="headline" color={c.period}>{onPeriodToday ? 'Period logged today · Undo' : 'Period started today'}</T>
              </View>
            </PressScale>
          </View>
        </Glass>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ gap: space.md }}>
        <SectionTitle>My daily insights</SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
          <PressScale onPress={() => openLog()} accessibilityRole="button" accessibilityLabel="Add symptoms">
            <Glass style={styles.tile}>
              <View style={[styles.tileIcon, { backgroundColor: c.accentSoft }]}><Icon name="plus" size={22} color={c.accent} /></View>
              <T v="subhead" style={{ fontWeight: '600' }}>Add{'\n'}symptoms</T>
            </Glass>
          </PressScale>
          <InsightTile bg={c.periodSoft} icon="dropFilled" iconColor={c.period} value={p.daysUntilNext != null && p.daysUntilNext > 0 ? `${p.daysUntilNext}d` : onPeriodToday ? `Day ${p.cycleDay}` : '—'} label="Next period" />
          <InsightTile bg={c.fertileSoft} icon="sparkle" iconColor={c.ovulation} value={fertileStatus.value} label={fertileStatus.sub} />
          <InsightTile bg={c.accentSoft} icon="calendar" iconColor={c.accent} value={`${p.avgCycle}d`} label="Average cycle" />
        </ScrollView>
      </Animated.View>

      {p.cycleDay && (
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <Glass style={styles.card}>
            <T v="headline">Where you are in your cycle</T>
            <PhaseStrip cycleDay={p.cycleDay} avgCycle={p.avgCycle} avgPeriod={p.avgPeriod} />
            {p.phase && <T v="subhead" color={c.textSecondary}>{PHASES[p.phase].blurb}</T>}
          </Glass>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ gap: space.md }}>
        <SectionTitle action={<GlassButton title={todayLog ? 'Edit' : 'Log'} svg="pen" onPress={() => openLog()} />}>Today’s log</SectionTitle>
        <Glass style={styles.card}>
          {todayLog && (todayLog.symptoms.length || todayLog.moods.length || todayLog.flow || todayLog.energy) ? (
            <View style={styles.wrap}>
              {todayLog.flow && <Chip label={`${cap(todayLog.flow)} flow`} selected icon="dropFilled" onPress={() => openLog()} />}
              {todayLog.moods.map((m) => (
                <Chip key={m} label={moodOf(m)?.label ?? m} emoji={moodOf(m)?.emoji} selected onPress={() => openLog()} />
              ))}
              {todayLog.symptoms.map((s) => (
                <Chip key={s} label={symptomLabel(s)} icon={symptomIcon(s)} selected onPress={() => openLog()} />
              ))}
              {todayLog.energy && <Chip label={`${cap(todayLog.energy)} energy`} icon="fatigue" selected onPress={() => openLog()} />}
            </View>
          ) : (
            <T v="callout" color={c.textSecondary} style={{ textAlign: 'center', paddingVertical: space.sm }}>
              How are you feeling? Logging takes about 10 seconds.
            </T>
          )}
        </Glass>
      </Animated.View>

      <View style={styles.privacy}>
        <Icon name="lock" size={14} color={c.textSecondary} />
        <T v="footnote" color={c.textSecondary} style={{ flexShrink: 1 }}>Stored only on this device. Predictions are estimates, not contraception.</T>
      </View>
    </Screen>
  );
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function InsightTile({ bg, icon, iconColor, value, label }: { bg: string; icon: IconName; iconColor: string; value: string; label: string }) {
  const c = useColors();
  return (
    <View style={[styles.tile, { backgroundColor: bg }]}>
      <Icon name={icon} size={22} color={iconColor} />
      <View>
        <T v="title1" style={{ fontVariant: ['tabular-nums'] }}>{value}</T>
        <T v="footnote" color={c.textSecondary} numberOfLines={2}>{label}</T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { padding: space.xl, gap: space.lg },
  card: { padding: space.lg, gap: space.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 16, rowGap: 6, marginTop: -8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  divider: { height: StyleSheet.hairlineWidth },
  phasePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginTop: 10 },
  secondary: { height: 52, borderRadius: radius.pill, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  tile: { width: 128, height: 140, borderRadius: 24, padding: 14, justifyContent: 'space-between' },
  tileIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  privacy: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
});
