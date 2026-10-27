import { router, useLocalSearchParams } from 'expo-router';
import { ReactNode, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../../components/Background';
import { Chip, IconTile } from '../../components/Chip';
import { Glass } from '../../components/Glass';
import { FlowDrops, Icon } from '../../components/icons';
import { Segmented } from '../../components/Segmented';
import { PressScale, PrimaryButton, T, Toggle } from '../../components/ui';
import { emptyLog, Energy } from '../../data/types';
import { ENERGY, FLOWS, MOODS, SYMPTOMS } from '../../lib/catalog';
import { fmt, todayISO } from '../../lib/dates';
import { haptics } from '../../lib/haptics';
import { useApp } from '../../store/useAppStore';
import { font, radius, space } from '../../theme/tokens';
import { useColors, useIsDark } from '../../theme/useTheme';

export default function LogDay() {
  const c = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const { date: param } = useLocalSearchParams<{ date: string }>();
  const date = !param || param === 'today' ? todayISO() : param;
  const existing = useApp((s) => s.logs[date]);
  const saveLog = useApp((s) => s.saveLog);
  const [log, setLog] = useState(() => existing ?? emptyLog(date));

  const toggleIn = (key: 'symptoms' | 'moods', id: string) =>
    setLog((l) => ({ ...l, [key]: l[key].includes(id) ? l[key].filter((x) => x !== id) : [...l[key], id] }));

  const save = async () => {
    await saveLog(log);
    haptics.success();
    router.back();
  };

  // 3 columns, every row full width (15 symptoms → 5 rows of 3)
  const COLS = 3;
  const rows: (typeof SYMPTOMS)[] = [];
  for (let i = 0; i < SYMPTOMS.length; i += COLS) rows.push(SYMPTOMS.slice(i, i + COLS));

  return (
    <View style={{ flex: 1 }}>
      <Background />
      <View style={[styles.header, { borderBottomColor: c.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
          <T v="callout" color={c.textSecondary}>Cancel</T>
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <T v="headline">{date === todayISO() ? 'Daily log' : fmt(date, 'EEEE')}</T>
          <T v="caption" color={c.textSecondary}>{fmt(date, 'd MMMM yyyy')}</T>
        </View>
        <Pressable onPress={save} hitSlop={12} accessibilityRole="button">
          <T v="callout" color={c.accent} style={{ fontWeight: '600' }}>Save</T>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 4 }}>
          <T v="title1">How are you feeling?</T>
          <T v="subhead" color={c.textSecondary}>Tap anything that applies. It all stays on this device.</T>
        </View>

        <Animated.View layout={LinearTransition}>
          <Glass style={styles.card} radius={radius.lg}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <View style={[styles.icon, { backgroundColor: c.periodSoft }]}>
                  <Icon name="dropFilled" size={20} color={c.period} />
                </View>
                <View>
                  <T v="headline">Period</T>
                  <T v="footnote" color={c.textSecondary}>{log.period ? 'Bleeding today' : 'Not on your period'}</T>
                </View>
              </View>
              <Toggle
                label="Period"
                value={log.period}
                onChange={(v) => setLog((l) => ({ ...l, period: v, flow: v ? l.flow ?? 'medium' : undefined }))}
              />
            </View>
            {log.period && (
              <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)} style={{ gap: 10 }}>
                <T v="overline" color={c.textSecondary}>Flow</T>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {FLOWS.map((f) => {
                    const on = log.flow === f.id;
                    return (
                      <PressScale
                        key={f.id}
                        haptic="tick"
                        fill
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={`${f.label} flow`}
                        onPress={() => setLog((l) => ({ ...l, flow: f.id }))}
                      >
                        <View
                          style={[
                            styles.flow,
                            on
                              ? { backgroundColor: c.periodSoft, borderColor: c.period }
                              : { backgroundColor: isDark ? c.fill : 'rgba(255,255,255,0.6)', borderColor: isDark ? c.separator : '#fff' },
                          ]}
                        >
                          <FlowDrops level={f.level} color={on ? c.period : c.textTertiary} />
                          <T v="footnote" color={on ? c.text : c.textSecondary} style={{ fontWeight: on ? '600' : '500' }}>{f.label}</T>
                        </View>
                      </PressScale>
                    );
                  })}
                </View>
              </Animated.View>
            )}
          </Glass>
        </Animated.View>

        <Section title="Symptoms">
          <View style={{ gap: 10 }}>
            {rows.map((row, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                {row.map((s) => (
                  <IconTile key={s.id} label={s.label} icon={s.icon} selected={log.symptoms.includes(s.id)} onPress={() => toggleIn('symptoms', s.id)} />
                ))}
              </View>
            ))}
          </View>
        </Section>

        <Section title="Mood">
          <View style={styles.wrap}>
            {MOODS.map((m) => (
              <Chip key={m.id} label={m.label} emoji={m.emoji} selected={log.moods.includes(m.id)} onPress={() => toggleIn('moods', m.id)} />
            ))}
          </View>
        </Section>

        <Section title="Energy">
          <Segmented<Energy> options={ENERGY} value={log.energy} allowNone onChange={(v) => setLog((l) => ({ ...l, energy: v }))} />
        </Section>

        <Section title="Notes">
          <TextInput
            value={log.notes ?? ''}
            onChangeText={(t) => setLog((l) => ({ ...l, notes: t }))}
            placeholder="Anything else worth remembering?"
            placeholderTextColor={c.textTertiary}
            multiline
            style={[styles.input, { position: 'relative', outlineWidth: 0, color: c.text, backgroundColor: c.fill, fontFamily: font.regular }]}
          />
        </Section>

        <PrimaryButton title="Save log" icon="sparkle" onPress={save} />
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Glass style={styles.card} radius={radius.lg}>
      <T v="title3">{title}</T>
      {children}
    </Glass>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  card: { padding: space.lg, gap: space.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  flow: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 20, borderWidth: 1.5 },
  input: { minHeight: 90, borderRadius: radius.md, padding: space.md, fontSize: 16, textAlignVertical: 'top' },
});
