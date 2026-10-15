import { GAME } from '../data/game-constants';
import { vehicleModel } from '../data/vehicle-catalog';
import { BusinessId, DayReport, GameEvent, GameState, Ledger, LedgerCategory, Vehicle } from '../models/game.models';
import { dayOf, nextMidnight, shiftHoursBetween } from './clock';
import { restockListings } from './market';
import { uid } from './random';
import { propertyIncomePerDay } from './property-rules';
import { breakdownChance, rollBreakdown } from './vehicle-rules';

// The game loop. `advance` mutates a draft GameState in place (the store clones before
// calling it) and returns the events it produced so the UI can toast them.

export function advance(state: GameState, hours: number): GameEvent[] {
  const emitted: GameEvent[] = [];
  const target = state.clock + hours;
  while (state.clock < target - 1e-9) {
    // Steps never cross midnight, so each day's report gets exactly its own money.
    const end = Math.min(target, state.clock + GAME.maxStepHours, nextMidnight(state.clock));
    step(state, state.clock, end, emitted);
    state.clock = end;
    if (dayOf(state.clock) !== state.today.day) closeDay(state);
  }
  return emitted;
}

function step(state: GameState, from: number, to: number, emitted: GameEvent[]): void {
  const dt = to - from;
  for (const v of state.vehicles) {
    const model = vehicleModel(v.modelId);

    // Insurance runs whatever the vehicle is doing.
    book(state, v, 'insurance', -(model.insurancePerDay / 24) * dt);

    if (v.garage && to >= v.garage.readyAt) finishGarageJob(state, v, emitted);
    if (v.status !== 'active') continue;

    let km = 0;
    if (v.assignment === 'delivery' && model.delivery) {
      const work = shiftHoursBetween(from, to);
      if (work <= 0) continue;
      km = model.delivery.kmPerHour * work;
      book(state, v, 'delivery', model.delivery.revenuePerHour * work);
      book(state, v, 'fuel', -km * model.delivery.fuelPerKm);
      if (v.driver === 'hired') book(state, v, 'wages', -model.delivery.driverWagePerHour * work);
    } else if (v.assignment === 'rental' && model.rental) {
      km = (model.rental.kmPerDay / 24) * dt;
      book(state, v, 'rental', (model.rental.ratePerDay / 24) * dt);
    } else {
      continue;
    }

    const chance = breakdownChance(v, km);
    v.km += km;

    if (v.km >= GAME.kmLimit) {
      v.km = GAME.kmLimit;
      v.status = 'worn-out';
      emit(state, emitted, {
        tone: 'danger',
        title: `${v.name} is worn out`,
        detail: `It hit ${GAME.kmLimit.toLocaleString('en-US')} km. Overhaul the engine or sell it for scrap.`,
        vehicleId: v.id,
      });
      continue;
    }

    if (Math.random() < chance) {
      v.breakdown = rollBreakdown(v, to);
      v.status = 'broken';
      v.lifetime.breakdowns++;
      emit(state, emitted, {
        tone: 'danger',
        title: `${v.name} broke down`,
        detail: `${v.breakdown.label} — repair quote ${money(v.breakdown.cost)}. It earns nothing until repaired.`,
        vehicleId: v.id,
      });
    }
  }

  // Restaurants and gas stations earn around the clock.
  for (const p of state.properties) {
    const income = (propertyIncomePerDay(p) / 24) * dt;
    book(state, null, 'sales-income', income, p.businessId);
    p.earned += income;
  }

  if (to >= state.market.refreshAt) {
    state.market.listings = restockListings();
    state.market.refreshAt = to + GAME.marketRefreshHours;
  }
}

function finishGarageJob(state: GameState, v: Vehicle, emitted: GameEvent[]): void {
  const job = v.garage!.job;
  v.garage = null;
  v.status = 'active';
  if (job === 'repair') {
    v.breakdown = null;
  } else if (job === 'service') {
    v.kmAtLastService = v.km;
  } else {
    v.km = 0;
    v.kmAtLastService = 0;
  }
  const what = job === 'repair' ? 'repaired' : job === 'service' ? 'serviced' : 'overhauled — the odometer is back to 0 km';
  emit(state, emitted, {
    tone: 'success',
    title: `${v.name} is back on the road`,
    detail: `${v.name} was ${what}.`,
    vehicleId: v.id,
  });
}

/**
 * Moves money and records it on the day's report — company-wide and for the business it
 * belongs to — and on the vehicle's lifetime.
 */
export function book(
  state: GameState,
  v: Vehicle | null,
  category: LedgerCategory,
  amount: number,
  businessId: BusinessId | undefined = v?.businessId,
): void {
  if (amount === 0) return;
  state.cash += amount;
  const day = state.today;
  addTo(day, category, amount);
  if (businessId) addTo((day.byBusiness[businessId] ??= emptyLedger()), category, amount);
  if (amount > 0) {
    state.totals.earned += amount;
    if (v) v.lifetime.revenue += amount;
  } else {
    state.totals.spent -= amount;
    if (v) v.lifetime.costs -= amount;
  }
}

function addTo(ledger: Ledger, category: LedgerCategory, amount: number): void {
  ledger.byCategory[category] = (ledger.byCategory[category] ?? 0) + amount;
  if (amount > 0) ledger.income += amount;
  else ledger.costs -= amount;
}

export function emptyLedger(): Ledger {
  return { income: 0, costs: 0, byCategory: {} };
}

export function emptyDay(clock: number): DayReport {
  return { day: dayOf(clock), ...emptyLedger(), byBusiness: {} };
}

function closeDay(state: GameState): void {
  state.history = [...state.history, state.today].slice(-GAME.historyDays);
  state.today = emptyDay(state.clock);
}

/** Records an event. One about a vehicle is filed under that vehicle's business. */
export function emit(state: GameState, emitted: GameEvent[] | null, e: Omit<GameEvent, 'id' | 'at'>): void {
  const businessId = e.businessId ?? state.vehicles.find((v) => v.id === e.vehicleId)?.businessId;
  const event: GameEvent = { id: uid(), at: state.clock, ...e, businessId };
  state.events = [event, ...state.events].slice(0, GAME.maxEvents);
  emitted?.push(event);
}

function money(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}
