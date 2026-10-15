import { GAME } from '../data/game-constants';
import { GameHours } from '../models/game.models';

/** Day number, 1-based. */
export function dayOf(clock: GameHours): number {
  return Math.floor(clock / 24) + 1;
}

export function hourOfDay(clock: GameHours): number {
  return clock - Math.floor(clock / 24) * 24;
}

/** "08:45" */
export function timeOfDay(clock: GameHours): string {
  const h = hourOfDay(clock);
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function isShiftHour(clock: GameHours): boolean {
  const h = hourOfDay(clock);
  return h >= GAME.shiftStart && h < GAME.shiftEnd;
}

/** Hours of the delivery shift that fall inside [from, to). */
export function shiftHoursBetween(from: GameHours, to: GameHours): number {
  let total = 0;
  for (let d = Math.floor(from / 24); d * 24 < to; d++) {
    const start = Math.max(from, d * 24 + GAME.shiftStart);
    const end = Math.min(to, d * 24 + GAME.shiftEnd);
    if (end > start) total += end - start;
  }
  return total;
}

export function nextMidnight(clock: GameHours): GameHours {
  return (Math.floor(clock / 24) + 1) * 24;
}

/** "2 h", "1 d 4 h" — a game-time duration. */
export function formatDuration(hours: number): string {
  const h = Math.max(0, Math.ceil(hours));
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  const rest = h % 24;
  return rest ? `${d} d ${rest} h` : `${d} d`;
}
