import type { IconName } from '../components/icons';
import type { Energy, Flow } from '../data/types';
import type { Phase } from './cycle';

export const SYMPTOMS: { id: string; label: string; icon: IconName }[] = [
  { id: 'cramps', label: 'Cramps', icon: 'cramps' },
  { id: 'headache', label: 'Headache', icon: 'headache' },
  { id: 'bloating', label: 'Bloating', icon: 'bloating' },
  { id: 'back_pain', label: 'Back pain', icon: 'back' },
  { id: 'breast_tenderness', label: 'Tender breasts', icon: 'breast' },
  { id: 'acne', label: 'Acne', icon: 'acne' },
  { id: 'fatigue', label: 'Fatigue', icon: 'fatigue' },
  { id: 'nausea', label: 'Nausea', icon: 'nausea' },
  { id: 'cravings', label: 'Cravings', icon: 'cravings' },
  { id: 'insomnia', label: 'Insomnia', icon: 'insomnia' },
  { id: 'dizziness', label: 'Dizziness', icon: 'dizzy' },
  { id: 'spotting', label: 'Spotting', icon: 'spotting' },
  { id: 'hot_flashes', label: 'Hot flashes', icon: 'hot' },
  { id: 'chills', label: 'Chills', icon: 'chills' },
];

export const MOODS: { id: string; label: string; emoji: string }[] = [
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'calm', label: 'Calm', emoji: '😌' },
  { id: 'confident', label: 'Confident', emoji: '😎' },
  { id: 'loving', label: 'Loving', emoji: '🥰' },
  { id: 'sensitive', label: 'Sensitive', emoji: '🥺' },
  { id: 'sad', label: 'Sad', emoji: '😢' },
  { id: 'anxious', label: 'Anxious', emoji: '😟' },
  { id: 'irritable', label: 'Irritable', emoji: '😤' },
  { id: 'sleepy', label: 'Tired', emoji: '😴' },
  { id: 'mood_swings', label: 'Mood swings', emoji: '🎭' },
];

export const FLOWS: { id: Flow; label: string; level: 1 | 2 | 3 }[] = [
  { id: 'light', label: 'Light', level: 1 },
  { id: 'medium', label: 'Medium', level: 2 },
  { id: 'heavy', label: 'Heavy', level: 3 },
];

export const ENERGY: { id: Energy; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

export const PHASES: Record<Phase, { label: string; short: string; blurb: string }> = {
  menstrual: { label: 'Menstrual phase', short: 'Period', blurb: 'Rest, warmth and iron-rich food can help.' },
  follicular: { label: 'Follicular phase', short: 'Follicular', blurb: 'Energy often rises in this phase.' },
  ovulation: { label: 'Ovulation window', short: 'Ovulation', blurb: 'Your estimated most fertile days.' },
  luteal: { label: 'Luteal phase', short: 'Luteal', blurb: 'PMS symptoms may show up later in this phase.' },
};

export const symptomLabel = (id: string) => SYMPTOMS.find((s) => s.id === id)?.label ?? id.replace(/_/g, ' ');
export const symptomIcon = (id: string): IconName => SYMPTOMS.find((s) => s.id === id)?.icon ?? 'sparkle';
export const moodOf = (id: string) => MOODS.find((m) => m.id === id);
