import { isShiftHour } from '../core/engine/clock';
import { Vehicle } from '../core/models/game.models';

export interface StatusView {
  label: string;
  /** Tailwind classes for the pill. */
  classes: string;
  /** Dot colour. */
  dot: string;
  pulse: boolean;
}

/** One place that decides how a vehicle's state reads on screen. */
export function vehicleStatus(v: Vehicle, clock: number): StatusView {
  switch (v.status) {
    case 'broken':
      return { label: 'Broken down', classes: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200', dot: 'bg-rose-500', pulse: true };
    case 'worn-out':
      return { label: 'Worn out', classes: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200', dot: 'bg-rose-500', pulse: false };
    case 'in-garage': {
      const left = Math.max(0, Math.ceil((v.garage?.readyAt ?? clock) - clock));
      const job = v.garage?.job === 'service' ? 'Service' : v.garage?.job === 'overhaul' ? 'Overhaul' : 'Repair';
      return { label: `${job} · ${left} h`, classes: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200', dot: 'bg-amber-500', pulse: true };
    }
  }
  if (v.assignment === 'rental') {
    return { label: 'Rented out', classes: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200', dot: 'bg-sky-500', pulse: false };
  }
  if (v.assignment === 'delivery') {
    return isShiftHour(clock)
      ? { label: 'On delivery', classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200', dot: 'bg-emerald-500', pulse: true }
      : { label: 'Off shift', classes: 'bg-stone-100 text-stone-600 ring-1 ring-inset ring-stone-200', dot: 'bg-stone-400', pulse: false };
  }
  return { label: 'Parked', classes: 'bg-stone-100 text-stone-600 ring-1 ring-inset ring-stone-200', dot: 'bg-stone-400', pulse: false };
}

/** Icon tile per vehicle class. */
export function classTile(cls: string): string {
  switch (cls) {
    case 'scooter': return 'bg-violet-50 text-violet-700';
    case 'car': return 'bg-sky-50 text-sky-700';
    case 'van': return 'bg-teal-50 text-teal-700';
    case 'truck': return 'bg-amber-50 text-amber-700';
    default: return 'bg-rose-50 text-rose-700';
  }
}

/** Odometer bar colour: fine, getting old, near the 1M km limit. */
export function wearColor(km: number, limit = 1_000_000): string {
  const w = km / limit;
  return w >= 0.85 ? 'bg-rose-500' : w >= 0.6 ? 'bg-amber-500' : 'bg-teal-600';
}

export function riskTone(risk: number): string {
  return risk >= 2.5 ? 'text-rose-700' : risk >= 1.5 ? 'text-amber-700' : 'text-emerald-700';
}
