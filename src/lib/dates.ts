import { addDays as add, differenceInCalendarDays, format, parseISO } from 'date-fns';

/** All dates in the app are local calendar days as 'yyyy-MM-dd'. */
export type ISODate = string;

export const toISO = (d: Date): ISODate => format(d, 'yyyy-MM-dd');
export const fromISO = (s: ISODate): Date => parseISO(s);
export const todayISO = (): ISODate => toISO(new Date());
export const addDaysISO = (s: ISODate, n: number): ISODate => toISO(add(fromISO(s), n));
export const diffDays = (a: ISODate, b: ISODate): number => differenceInCalendarDays(fromISO(a), fromISO(b));
export const fmt = (s: ISODate, pattern: string): string => format(fromISO(s), pattern);

/** "Nov 8 – 11" or "Oct 30 – Nov 2" */
export function formatRange(a: ISODate, b: ISODate): string {
  if (a === b) return fmt(a, 'MMM d');
  const sameMonth = fmt(a, 'yyyy-MM') === fmt(b, 'yyyy-MM');
  return sameMonth ? `${fmt(a, 'MMM d')} – ${fmt(b, 'd')}` : `${fmt(a, 'MMM d')} – ${fmt(b, 'MMM d')}`;
}
