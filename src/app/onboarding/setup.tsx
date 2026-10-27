import { addMonths, subMonths } from 'date-fns';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../../components/Background';
import { Chip } from '../../components/Chip';
import { Glass } from '../../components/Glass';
import { MonthCalendar, monthTitle } from '../../components/MonthCalendar';
import { GlassButton, PrimaryButton, T } from '../../components/ui';
import { WheelPicker } from '../../components/WheelPicker';
import { addDaysISO, fmt, ISODate, todayISO } from '../../lib/dates';
import { haptics } from '../../lib/haptics';
import { useApp } from '../../store/useAppStore';
import { font, radius, space } from '../../theme/tokens';
import { useColors } from '../../theme/useTheme';

const CYCLE = Array.from({ length: 31 }, (_, i) => i + 18);
const PERIOD = Array.from({ length: 11 }, (_, i) => i + 2);
const STEPS = 4;

export default function Setup() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useApp((s) => s.completeOnboarding);
  const today = todayISO();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [month, setMonth] = useState(() => new Date());
  const [lastStart, setLastStart] = useState<ISODate | null>(null);
  const [cycleLength, setCycleLength] = useState(28);
  const [cycleUnknown, setCycleUnknown] = useState(false);
  const [periodLength, setPeriodLength] = useState(5);
  const [periodUnknown, setPeriodUnknown] = useState(false);

  const progress = useAnimatedStyle(() => ({ width: withSpring(`${((step + 1) / STEPS) * 100}%`, { damping: 20 }) }));

  const next = async () => {
    if (step < STEPS - 1) {
      haptics.tap();
      setStep(step + 1);
      return;
    }
    await completeOnboarding({
      name,
      // "I don't remember" → assume roughly two weeks ago, flagged low-confidence by the engine
      lastPeriodStart: lastStart ?? addDaysISO(today, -14),
      cycleLength: cycleUnknown ? 28 : cycleLength,
      periodLength: periodUnknown ? 5 : periodLength,
      goal: 'period',
    });
    router.push('/onboarding/privacy');
  };

  const back = () => (step === 0 ? router.back() : setStep(step - 1));

  return (
    <View style={{ flex: 1 }}>
      <Background />
      <View style={{ flex: 1, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16, paddingHorizontal: space.xl, gap: space.xl }}>
        <View style={styles.topBar}>
          <GlassButton icon="chevron-back" compact onPress={back} />
          <View style={[styles.track, { backgroundColor: c.fill }]}>
            <Animated.View style={[styles.fill, { backgroundColor: c.accent }, progress]} />
          </View>
          <T v="footnote" color={c.textSecondary} style={{ width: 32, textAlign: 'right' }}>{step + 1}/{STEPS}</T>
        </View>

        <Animated.View key={step} entering={FadeInRight.duration(350)} exiting={FadeOutLeft.duration(200)} style={{ flex: 1, gap: space.lg }}>
          {step === 0 && (
            <>
              <Title title="What should we call you?" sub="Just a first name or nickname. It stays on this device." />
              <Glass style={[styles.card, { paddingVertical: space.sm }]} radius={radius.lg}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={c.textTertiary}
                  autoFocus
                  autoCapitalize="words"
                  autoComplete="given-name"
                  textContentType="givenName"
                  returnKeyType="next"
                  maxLength={24}
                  onSubmitEditing={next}
                  accessibilityLabel="Your name"
                  style={{ position: 'relative', outlineWidth: 0, fontFamily: font.semibold, fontSize: 24, color: c.text, paddingVertical: 10 }}
                />
              </Glass>
            </>
          )}

          {step === 1 && (
            <>
              <Title title="When did your last period start?" sub="Tap the first day of your most recent period." />
              <Glass style={styles.card}>
                <View style={styles.monthBar}>
                  <GlassButton icon="chevron-back" compact onPress={() => setMonth((m) => subMonths(m, 1))} />
                  <T v="headline">{monthTitle(month)}</T>
                  <GlassButton icon="chevron-forward" compact onPress={() => setMonth((m) => addMonths(m, 1))} />
                </View>
                <MonthCalendar month={month} today={today} selected={lastStart} onPressDay={setLastStart} disableFuture />
              </Glass>
              <Pressable onPress={() => { haptics.tick(); setLastStart(null); next(); }} accessibilityRole="button">
                <T v="body" color={c.accent} style={{ textAlign: 'center' }}>I don’t remember</T>
              </Pressable>
            </>
          )}

          {step === 2 && (
            <>
              <Title title="How long is your cycle usually?" sub="From the first day of one period to the first day of the next. Most cycles are 21–35 days." />
              <Glass style={[styles.card, { alignItems: 'center', opacity: cycleUnknown ? 0.4 : 1 }]}>
                <WheelPicker values={CYCLE} value={cycleLength} onChange={setCycleLength} unit="days" width={200} accessibilityLabel="Cycle length" />
              </Glass>
              <View style={{ alignItems: 'center' }}>
                <Chip label="I don’t know — use 28 days" selected={cycleUnknown} onPress={() => setCycleUnknown((v) => !v)} />
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Title title="How many days does your period last?" sub="An estimate is fine — Luna learns from what you log." />
              <Glass style={[styles.card, { alignItems: 'center', opacity: periodUnknown ? 0.4 : 1 }]}>
                <WheelPicker values={PERIOD} value={periodLength} onChange={setPeriodLength} unit="days" width={200} accessibilityLabel="Period length" />
              </Glass>
              <View style={{ alignItems: 'center' }}>
                <Chip label="I don’t know — use 5 days" selected={periodUnknown} onPress={() => setPeriodUnknown((v) => !v)} />
              </View>
            </>
          )}
        </Animated.View>

        {step === 1 && lastStart && (
          <T v="subhead" color={c.textSecondary} style={{ textAlign: 'center' }}>
            Selected: {fmt(lastStart, 'EEEE, d MMMM')}
          </T>
        )}
        <PrimaryButton title={step === STEPS - 1 ? 'Finish' : step === 0 && !name.trim() ? 'Skip' : 'Continue'} onPress={next} disabled={step === 1 && !lastStart} />
      </View>
    </View>
  );
}

function Title({ title, sub }: { title: string; sub: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 8 }}>
      <T v="title1">{title}</T>
      <T v="body" color={c.textSecondary}>{sub}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  card: { padding: space.lg, gap: space.md },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
