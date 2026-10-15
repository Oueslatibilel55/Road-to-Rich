export function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function pickWeighted<T>(items: readonly T[], weight: (item: T) => number): T {
  const total = items.reduce((sum, i) => sum + weight(i), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= weight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

const LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ';

/** "RR-482-KT" */
export function plateNumber(): string {
  const n = String(Math.floor(between(100, 1000)));
  return `RR-${n}-${pick([...LETTERS])}${pick([...LETTERS])}`;
}

export function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}
