import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { AppLockGate } from '../components/AppLock';
import { useReminderSync } from '../lib/useReminderSync';
import { useApp } from '../store/useAppStore';
import { dark, light } from '../theme/tokens';
import { useIsDark } from '../theme/useTheme';

export default function RootLayout() {
  const isDark = useIsDark();
  const ready = useApp((s) => s.ready);
  const init = useApp((s) => s.init);
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });
  const c = isDark ? dark : light;
  useReminderSync();

  useEffect(() => {
    init();
  }, [init]);

  const base = isDark ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, background: c.background, primary: c.accent, text: c.text, card: c.background } };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ThemeProvider value={theme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {!ready || !fontsLoaded ? (
          <View style={{ flex: 1, backgroundColor: c.background }} />
        ) : (
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
            <Stack.Screen
              name="log/[date]"
              options={{
                presentation: 'formSheet',
                sheetAllowedDetents: [0.94],
                sheetGrabberVisible: true,
                sheetCornerRadius: 32,
                contentStyle: { backgroundColor: c.background },
              }}
            />
            <Stack.Screen
              name="lock-setup"
              options={{ presentation: 'formSheet', sheetAllowedDetents: [0.94], sheetGrabberVisible: true, sheetCornerRadius: 32, gestureEnabled: true, contentStyle: { backgroundColor: c.background } }}
            />
            <Stack.Screen name="reminders" options={{ presentation: 'modal', contentStyle: { backgroundColor: c.background } }} />
          </Stack>
        )}
        {ready && fontsLoaded && <AppLockGate />}
      </ThemeProvider>
    </View>
  );
}
