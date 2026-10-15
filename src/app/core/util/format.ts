import { Pipe, PipeTransform } from '@angular/core';
import { dayOf, timeOfDay } from '../engine/clock';

const usd0 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function formatMoney(value: number, cents = false): string {
  return (cents ? usd2 : usd0).format(value);
}

/** $1.2M, $45.3K, $20K, $820 */
export function formatMoneyShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}$${trim(abs / 1e9, 2)}B`;
  if (abs >= 1e6) return `${sign}$${trim(abs / 1e6, 2)}M`;
  if (abs >= 1e4) return `${sign}$${trim(abs / 1e3, 1)}K`;
  return `${sign}$${int.format(abs)}`;
}

/** 20.0 → "20", 1.50 → "1.5" */
function trim(n: number, digits: number): string {
  return String(Number(n.toFixed(digits)));
}

export function formatKm(km: number): string {
  return `${int.format(km)} km`;
}

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined, mode: 'full' | 'cents' | 'short' = 'full'): string {
    if (value == null) return '—';
    return mode === 'short' ? formatMoneyShort(value) : formatMoney(value, mode === 'cents');
  }
}

@Pipe({ name: 'km' })
export class KmPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return value == null ? '—' : formatKm(value);
  }
}

/** Game clock → "Day 4 · 14:30" */
@Pipe({ name: 'gameTime' })
export class GameTimePipe implements PipeTransform {
  transform(clock: number, mode: 'full' | 'time' | 'day' = 'full'): string {
    if (mode === 'time') return timeOfDay(clock);
    if (mode === 'day') return `Day ${dayOf(clock)}`;
    return `Day ${dayOf(clock)} · ${timeOfDay(clock)}`;
  }
}
