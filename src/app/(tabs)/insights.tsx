import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';
import { CycleBars } from '../../components/CycleBars';
import { Glass } from '../../components/Glass';
import { Icon } from '../../components/icons';
import { ListGroup, ListRow, Screen, SectionTitle, T } from '../../components/ui';
import { symptomLabel } from '../../lib/catalog';
import { cycleStats, irregularity, predict, symptomStats } from '../../lib/cycle';
import { addDaysISO, diffDays, formatRange, todayISO } from '../../lib/dates';
import { useApp } from '../../store/useAppStore';
import { space } from '../../theme/tokens';
import { useColors } from '../../theme/useTheme';

export default function Insights() {
  const c = useColors();
  const { logs, settings } = useApp();
  const today = todayISO();
  const stats = useMemo(() => cycleStats(logs, settings), [logs, settings]);
  const p = useMemo(() => predict(logs, settings, today), [logs, settings, today]);
  const symptoms = useMemo(() => symptomStats(logs).slice(0, 5), [logs]);
  const flag = irregularity(stats.valid.map((v) => v.length));

  const bars = [
    ...stats.history.slice(-5).map((h) => ({ key: h.start, start: h.start, length: h.length, periodLength: h.periodLength })),
    ...(p.lastStart
      ? [{ key: 'current', start: p.lastStart, length: diffDays(today, p.lastStart) + 1, periodLength: stats.runs[stats.runs.length - 1]?.length ?? 0, current: true }]
      : []),
  ];

  const pattern = symptoms.find((s) => s.typicalOffset !== null);

  return (
    <Screen title="Insights">
      <View style={styles.tiles}>
        <Tile label="Avg cycle" value={`${stats.avgCycle}`} unit="days" sub={stats.valid.length ? `${stats.valid.length} cycles` : 'from setup'} />
        <Tile label="Avg period" value={`${stats.avgPeriod}`} unit="days" sub={stats.runs.length > 1 ? 'logged' : 'from setup'} />
      </View>

      <Animated.View entering={FadeInDown.duration(500)}>
        <Glass style={styles.card}>
          <T v="headline">Cycle length</T>
          {bars.length ? (
            <CycleBars bars={bars} avg={stats.avgCycle} />
          ) : (
            <T v="subhead" color={c.textSecondary}>Log a period to start seeing your cycles here.</T>
          )}
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Key color={c.period} label="Period" />
            <Key color={c.luteal} label="Cycle" />
            <Key color={c.accentSoft} label="Current" dashed />
          </View>
        </Glass>
      </Animated.View>

      {flag && (
        <Glass style={[styles.card, { flexDirection: 'row', gap: 12 }]} tint={c.fertileSoft}>
          <Icon name="sparkle" size={22} color={c.ovulation} />
          <View style={{ flex: 1, gap: 4 }}>
            <T v="headline">Worth keeping an eye on</T>
            <T v="subhead" color={c.textSecondary}>
              {flag} This can be normal, but if it continues, consider mentioning it to a doctor.
            </T>
          </View>
        </Glass>
      )}

      <SectionTitle>Symptoms</SectionTitle>
      <Glass style={styles.card}>
        {symptoms.length ? (
          <>
            {symptoms.map((s, i) => (
              <StripRow key={s.id} label={symptomLabel(s.id)} share={s.share} delay={i * 80} />
            ))}
            {pattern && (
              <View style={[styles.callout, { backgroundColor: c.accentSoft }]}>
                <Icon name="sparkle" size={20} color={c.accent} />
                <T v="subhead" style={{ flex: 1 }}>
                  {symptomLabel(pattern.id)} usually shows up{' '}
                  {pattern.typicalOffset === 0 ? 'on the first day of your period' : `${-pattern.typicalOffset!} day${pattern.typicalOffset === -1 ? '' : 's'} before your period`}.
                </T>
              </View>
            )}
          </>
        ) : (
          <T v="subhead" color={c.textSecondary}>Patterns appear after you log symptoms for a cycle or two.</T>
        )}
      </Glass>

      {stats.history.length > 0 && (
        <ListGroup header="Cycle history">
          {[...stats.history].reverse().slice(0, 8).map((h, i, arr) => (
            <ListRow
              key={h.start}
              title={formatRange(h.start, addDaysISO(h.start, h.length - 1))}
              subtitle={`Period ${h.periodLength} days`}
              value={`${h.length} days`}
              last={i === arr.length - 1}
            />
          ))}
        </ListGroup>
      )}
    </Screen>
  );
}

function Tile({ label, value, unit, sub }: { label: string; value: string; unit: string; sub: string }) {
  const c = useColors();
  return (
    <Glass style={[styles.card, { flex: 1, gap: 2 }]}>
      <T v="footnote" color={c.textSecondary} style={{ fontWeight: '600' }}>{label.toUpperCase()}</T>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        <T style={{ fontSize: 40, lineHeight: 50, fontWeight: '700', letterSpacing: -1, fontVariant: ['tabular-nums'] }}>{value}</T>
        <T v="subhead" color={c.textSecondary}>{unit}</T>
      </View>
      <T v="footnote" color={c.textSecondary}>{sub}</T>
    </Glass>
  );
}

/** Horizontal percentage strip. */
function StripRow({ label, share, delay }: { label: string; share: number; delay: number }) {
  const c = useColors();
  const a = useAnimatedStyle(() => ({ width: withDelay(delay, withTiming(`${Math.round(share * 100)}%`, { duration: 700 })) }));
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <T v="subhead">{label}</T>
        <T v="subhead" color={c.textSecondary} style={{ fontVariant: ['tabular-nums'] }}>{Math.round(share * 100)}%</T>
      </View>
      <View style={[styles.track, { backgroundColor: c.fill }]}>
        <Animated.View style={[styles.fill, { backgroundColor: c.period }, a]} />
      </View>
    </View>
  );
}

function Key({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color, borderWidth: dashed ? 1 : 0, borderColor: c.luteal, borderStyle: 'dashed' }} />
      <T v="footnote" color={c.textSecondary}>{label}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: space.md },
  card: { padding: space.lg, gap: space.md },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 5 },
  callout: { flexDirection: 'row', gap: 10, padding: space.md, borderRadius: 14, alignItems: 'center' },
});
