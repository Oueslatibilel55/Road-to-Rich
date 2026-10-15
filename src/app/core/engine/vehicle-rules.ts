import { BREAKDOWN_TYPES } from '../data/breakdowns';
import { GAME } from '../data/game-constants';
import { vehicleModel } from '../data/vehicle-catalog';
import {
  Assignment,
  Breakdown,
  DriverKind,
  GameHours,
  Vehicle,
  VehicleModel,
} from '../models/game.models';
import { between, pickWeighted, roundTo } from './random';

// Pure rules about a single vehicle. No state, no side effects except the random rolls —
// this file is the first candidate to move server-side.

/** 0 = new, 1 = at the km limit. */
export function wearOf(km: number): number {
  return Math.min(1, km / GAME.kmLimit);
}

export function kmSinceService(v: Vehicle): number {
  return v.km - v.kmAtLastService;
}

/** 0..1+ — above 1 the service is overdue. */
export function serviceProgress(v: Vehicle): number {
  return kmSinceService(v) / vehicleModel(v.modelId).serviceIntervalKm;
}

export function isServiceDue(v: Vehicle): boolean {
  return serviceProgress(v) >= 0.9;
}

/**
 * How much more likely than a new, serviced vehicle this one is to break down.
 * Mileage pushes it up (×3.5 at the limit); every interval of overdue service adds ×1.5.
 */
export function breakdownRisk(v: Vehicle): number {
  const overdue = Math.max(0, serviceProgress(v) - 1);
  return Math.min(8, mileageRisk(v.km) * (1 + 1.5 * overdue));
}

/** The mileage part of the risk alone: ×1 new, ×3.5 at the km limit. */
export function mileageRisk(km: number): number {
  const wear = wearOf(km);
  return 1 + 2.5 * wear * wear;
}

/** Chance of breaking down while driving `km` more. */
export function breakdownChance(v: Vehicle, km: number): number {
  const model = vehicleModel(v.modelId);
  return 1 - Math.exp(-(km / model.kmBetweenBreakdowns) * breakdownRisk(v));
}

export function rollBreakdown(v: Vehicle, at: GameHours): Breakdown {
  const model = vehicleModel(v.modelId);
  const wear = wearOf(v.km);
  const type = pickWeighted(BREAKDOWN_TYPES, (t) => t.weight + t.wearWeight * wear);
  const cost = roundTo(Math.max(type.minCost, type.costShare * model.price) * between(0.85, 1.2), 5);
  return { typeId: type.id, label: type.label, severity: type.severity, cost, hours: type.hours, at };
}

export function repairQuote(b: Breakdown, express: boolean): { cost: number; hours: number } {
  return express
    ? { cost: roundTo(b.cost * GAME.expressCostFactor, 5), hours: Math.max(1, Math.round(b.hours * GAME.expressTimeFactor)) }
    : { cost: b.cost, hours: b.hours };
}

export function overhaulCost(model: VehicleModel): number {
  return roundTo(model.price * GAME.overhaulCostShare, 50);
}

/** What the vehicle is worth on the used market at this mileage. */
export function marketValue(model: VehicleModel, km: number): number {
  const remaining = Math.max(0, 1 - km / 1_100_000);
  return Math.max(model.price * 0.08, model.price * 0.9 * Math.pow(remaining, 1.4));
}

export function scrapValue(model: VehicleModel): number {
  return roundTo(model.price * GAME.scrapValueShare, 10);
}

/** What a dealer pays for it today. A broken vehicle is bought minus its repair. */
export function sellValue(v: Vehicle): number {
  const model = vehicleModel(v.modelId);
  if (v.status === 'worn-out') return scrapValue(model);
  const repair = v.status === 'broken' && v.breakdown ? v.breakdown.cost : 0;
  return Math.max(scrapValue(model), roundTo(marketValue(model, v.km) * GAME.dealerBuyBackShare - repair, 10));
}

export interface DailyEstimate {
  income: number;
  fuel: number;
  wages: number;
  insurance: number;
  net: number;
  kmPerDay: number;
  /** Expected breakdowns per day for a new vehicle. */
  breakdownsPerDay: number;
}

/** What a vehicle earns in an average day doing a job (before breakdowns). */
export function dailyEstimate(model: VehicleModel, assignment: Assignment, driver: DriverKind): DailyEstimate {
  const shift = GAME.shiftEnd - GAME.shiftStart;
  let income = 0;
  let fuel = 0;
  let wages = 0;
  let kmPerDay = 0;
  if (assignment === 'delivery' && model.delivery) {
    kmPerDay = model.delivery.kmPerHour * shift;
    income = model.delivery.revenuePerHour * shift;
    fuel = kmPerDay * model.delivery.fuelPerKm;
    wages = driver === 'hired' ? model.delivery.driverWagePerHour * shift : 0;
  } else if (assignment === 'rental' && model.rental) {
    kmPerDay = model.rental.kmPerDay;
    income = model.rental.ratePerDay;
  }
  const insurance = model.insurancePerDay;
  return {
    income,
    fuel,
    wages,
    insurance,
    net: income - fuel - wages - insurance,
    kmPerDay,
    breakdownsPerDay: kmPerDay / model.kmBetweenBreakdowns,
  };
}

/** The job a vehicle of this model does when it works: deliver or rent out. */
export function workingJob(model: VehicleModel): Assignment {
  return model.delivery ? 'delivery' : 'rental';
}

/** Days for a vehicle to pay back its price on a job. */
export function paybackDays(model: VehicleModel, assignment: Assignment, driver: DriverKind, price = model.price): number {
  const net = dailyEstimate(model, assignment, driver).net;
  return net > 0 ? price / net : Infinity;
}
