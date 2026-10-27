import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Segmented } from '../../components/Segmented';
import { ListGroup, ListRow, Screen, T, Toggle } from '../../components/ui';
import { WheelPicker } from '../../components/WheelPicker';
import { LockSettings } from '../../data/types';
import { authenticate } from '../../lib/biometrics';
import { haptics } from '../../lib/haptics';
import { useApp } from '../../store/useAppStore';
import { useLock } from '../../store/useLock';
import { font, space } from '../../theme/tokens';
import { useColors } from '../../theme/useTheme';

const CYCLE = Array.from({ length: 31 }, (_, i) => i + 18); // 18–48
const PERIOD = Array.from({ length: 11 }, (_, i) => i + 2); // 2–12
const AUTO: { id: '0' | '60' | '300'; label: string }[] = [
  { id: '0', label: 'Immediately' },
  { id: '60', label: '1 min' },
  { id: '300', label: '5 min' },
];

export default function SettingsScreen() {
  const c = useColors();
  const { settings, updateSettings, encrypted, resetAll } = useApp();
  const { bio, refresh } = useLock();
  const lock = settings.lock;
  const [open, setOpen] = useState<'cycle' | 'period' | 'name' | null>(null);
  const [name, setName] = useState(settings.name);
  const toggle = (k: 'cycle' | 'period' | 'name') => setOpen((o) => (o === k ? null : k));
  const remindersOn = Object.values(settings.reminders).filter((v) => typeof v === 'object' && v.enabled).length;

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setLock = (patch: Partial<LockSettings>) => updateSettings({ lock: { ...lock, ...patch } });

  const onLockToggle = (on: boolean) =>
    router.push({ pathname: '/lock-setup', params: { mode: on ? 'create' : 'disable' } });

  const onBioToggle = async (on: boolean) => {
    // Confirm it's really the owner before turning biometrics on
    if (on && !(await authenticate(`Turn on ${bio.label} for Luna`))) return;
    setLock({ biometrics: on });
  };

  const confirmDelete = () => {
    haptics.warning();
    const run = async () => {
      await resetAll();
      haptics.success();
      router.replace('/onboarding');
    };
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('Delete all data? This permanently removes all your logs, settings, PIN and reminders from this device.')) run();
      return;
    }
    Alert.alert('Delete all data?', 'This permanently removes all your logs, settings, PIN and reminders from this device. It can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All Data', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <Screen title="Settings">
      <Animated.View layout={LinearTransition}>
        <ListGroup header="You">
          <ListRow icon="sparkle" iconBg={c.accent} title="Name" value={settings.name || 'Add'} onPress={() => toggle('name')} last={open !== 'name'} />
          {open === 'name' && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={{ paddingHorizontal: space.lg, paddingBottom: space.md }}>
              <TextInput
                value={name}
                onChangeText={setName}
                onBlur={() => updateSettings({ name: name.trim() })}
                onSubmitEditing={() => {
                  updateSettings({ name: name.trim() });
                  setOpen(null);
                }}
                placeholder="Your name"
                placeholderTextColor={c.textTertiary}
                autoFocus
                maxLength={24}
                returnKeyType="done"
                style={{ position: 'relative', outlineWidth: 0, fontFamily: font.medium, fontSize: 17, color: c.text, backgroundColor: c.fill, borderRadius: 12, padding: 12 }}
              />
            </Animated.View>
          )}
        </ListGroup>
      </Animated.View>

      <Animated.View layout={LinearTransition}>
        <ListGroup header="Your cycle" footer="Used for predictions until you’ve logged a few cycles. After that Luna learns from your history.">
          <ListRow icon="calendar" iconBg={c.accent} title="Typical cycle length" value={`${settings.cycleLength} days`} onPress={() => toggle('cycle')} />
          {open === 'cycle' && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <WheelPicker values={CYCLE} value={settings.cycleLength} onChange={(v) => updateSettings({ cycleLength: v })} unit="days" width={190} accessibilityLabel="Typical cycle length" />
            </Animated.View>
          )}
          <ListRow icon="dropFilled" iconBg={c.period} title="Typical period length" value={`${settings.periodLength} days`} onPress={() => toggle('period')} last={open !== 'period'} />
          {open === 'period' && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <WheelPicker values={PERIOD} value={settings.periodLength} onChange={(v) => updateSettings({ periodLength: v })} unit="days" width={190} accessibilityLabel="Typical period length" />
            </Animated.View>
          )}
        </ListGroup>
      </Animated.View>

      <ListGroup header="Reminders">
        <ListRow
          icon="bell"
          iconBg="#D0703F"
          title="Notifications"
          subtitle={settings.reminders.discreet ? 'Discreet wording on' : 'Detailed wording'}
          value={remindersOn ? `${remindersOn} on` : 'Off'}
          onPress={() => router.push('/reminders')}
          last
        />
      </ListGroup>

      <Animated.View layout={LinearTransition}>
        <ListGroup
          header="Security"
          footer={lock.enabled ? `Luna locks ${lock.autoLockAfter === 0 ? 'as soon as you leave' : `after ${lock.autoLockAfter / 60} min away`}. Your PIN never leaves this device.` : 'Ask for a PIN or biometrics every time Luna opens.'}
        >
          <ListRow icon="lock" iconBg="#4A2D52" title="App lock" right={<Toggle label="App lock" value={lock.enabled} onChange={onLockToggle} activeColor={c.accent} />} last={!lock.enabled} />
          {lock.enabled && (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              {bio.available && (
                <ListRow
                  icon="shield"
                  iconBg="#3E8E7E"
                  title={`Unlock with ${bio.label}`}
                  right={<Toggle label={`Unlock with ${bio.label}`} value={lock.biometrics} onChange={onBioToggle} activeColor={c.accent} />}
                />
              )}
              <ListRow
                icon="eyeOff"
                iconBg="#8A6B92"
                title="Hide in app switcher"
                right={<Toggle label="Hide in app switcher" value={lock.hideInSwitcher} onChange={(v) => setLock({ hideInSwitcher: v })} activeColor={c.accent} />}
              />
              <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md, gap: 8, borderBottomWidth: 0.5, borderBottomColor: c.separator }}>
                <T v="callout" style={{ fontWeight: '500' }}>Auto-lock</T>
                <Segmented
                  options={AUTO}
                  value={String(lock.autoLockAfter) as '0' | '60' | '300'}
                  onChange={(v) => v && setLock({ autoLockAfter: Number(v) as 0 | 60 | 300 })}
                />
              </View>
              <ListRow icon="pen" iconBg="#6B4A75" title="Change PIN" onPress={() => router.push({ pathname: '/lock-setup', params: { mode: 'change' } })} last />
            </Animated.View>
          )}
        </ListGroup>
      </Animated.View>

      <ListGroup header="Privacy" footer="Luna has no account, no ads and no analytics SDKs. Nothing is sent anywhere.">
        <ListRow icon="phone" iconBg="#3E8E7E" title="Storage" value="This device only" />
        <ListRow icon="shield" iconBg="#6B4A75" title="Encryption" value={encrypted ? 'On · AES-256' : Platform.OS === 'web' ? 'Preview only' : 'Needs dev build'} />
        <ListRow icon="eyeOff" iconBg="#8A6B92" title="Trackers" value="None" last />
      </ListGroup>

      <ListGroup header="Data" footer="Deleting removes every log, setting, your PIN and all reminders from this device permanently.">
        <ListRow icon="trash" iconBg={c.danger} title="Delete all data" destructive onPress={confirmDelete} last />
      </ListGroup>

      <View style={{ paddingHorizontal: 16, gap: 4 }}>
        <T v="footnote" color={c.textSecondary}>
          Luna helps you understand your cycle. It isn’t a medical device, doesn’t diagnose conditions and must not be used as contraception.
        </T>
        <T v="footnote" color={c.textSecondary}>Version 0.3.0</T>
      </View>
    </Screen>
  );
}
