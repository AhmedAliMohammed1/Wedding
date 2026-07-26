import { differenceInSeconds, isValid, parseISO } from 'date-fns';

export interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  complete: boolean;
  valid: boolean;
}

export function calculateCountdown(dateIso: string, now = new Date()): CountdownValue {
  const target = parseISO(dateIso);
  if (!isValid(target)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, complete: false, valid: false };
  }
  const total = Math.max(0, differenceInSeconds(target, now));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
    complete: total === 0,
    valid: true
  };
}
