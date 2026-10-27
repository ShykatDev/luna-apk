import { useColorScheme } from 'react-native';
import { dark, light, ThemeColors } from './tokens';

export function useColors(): ThemeColors {
  return useColorScheme() === 'dark' ? dark : light;
}

export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}
