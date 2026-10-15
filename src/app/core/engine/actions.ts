import { BUSINESSES, businessInfo } from '../data/businesses';
import { GAME } from '../data/game-constants';
import { FUEL_BRANDS, MAX_PROPERTY_LEVEL, propertyType } from '../data/property-catalog';
import { CLASS_LABEL, modelName, vehicleModel } from '../data/vehicle-catalog';
import {
  Assignment,
  BusinessId,
  BusinessState,
  DriverKind,
  GameState,
  Property,
  PropertyTypeId,
  Vehicle,
  VehicleModelId,
} from '../models/game.models';
import { roadAddress, streetAddress } from './locations';
import { restockListings } from './market';
import { propertySellValue, upgradeCost } from './property-rules';
import { pick, plateNumber, uid } from './random';
import { book, emit, emptyDay } from './simulation';
import { overhaulCost, repairQuote, scrapValue, sellValue, workingJob } from './vehicle-rules';

// Player commands. Each one mutates a draft state and returns null on success or an error
// message — the same shape the backend will answer with (a 400 with a message).

export type ActionResult = string | null;

/** Bump when GameState changes shape; the store migrates or restarts older saves. */
export const SAVE_VERSION = 3;

const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

export function newGame(): GameState {
  const clock = GAME.startClock;
  return {
    version: SAVE_VERSION,
    cash: GAME.startingCash,
    clock,
    speed: 1,
    businesses: closedBusinesses(),
    vehicles: [],
    properties: [],
    market: { listings: restockListings(), refreshAt: clock + GAME.marketRefreshHours },
    events: [
      {
        id: uid(),
        at: clock,
        tone: 'info',
        title: 'Welcome, founder',
        detail: 'You start with $50,000. The Delivery Company is free to open; the others need a licence.',
      },
    ],
    today: emptyDay(clock),
    history: [],
    totals: { earned: 0, spent: 0 },
    nextVehicleNumber: 1,
  };
}

export function closedBusinesses(): Record<BusinessId, BusinessState> {
  return Object.fromEntries(BUSINESSES.map((b) => [b.id, { openedAt: null }])) as Record<BusinessId, BusinessState>;
}

function isOpen(s: GameState, id: BusinessId): boolean {
  return s.businesses[id]?.openedAt != null;
}

/** Opening costs the licence price; the Delivery Company is free. */
export function openBusiness(s: GameState, id: BusinessId): ActionResult {
  const info = businessInfo(id);
  if (!info || info.comingSoon) return 'This business is not available yet.';
  if (isOpen(s, id)) return 'This business is already open.';
  if (s.cash < info.openCost) return `The licence costs ${money(info.openCost)}.`;
  if (info.openCost) book(s, null, 'licenses', -info.openCost, id);
  s.businesses[id] = { openedAt: s.clock };
  emit(s, null, {
    businessId: id,
    tone: 'success',
    title: `${info.name} opened`,
    detail: info.openCost ? `Licence paid: ${money(info.openCost)}.` : 'Opening it was free.',
    amount: info.openCost ? -info.openCost : undefined,
  });
  return null;
}

// ── Admin (testing) ───────────────────────────────────────────────────────
// Free money is not income: it changes cash only, never the earnings or the reports.

export function grantTestCash(s: GameState, amount: number): ActionResult {
  s.cash += amount;
  emit(s, null, { tone: 'info', title: 'Test money added', detail: `${money(amount)} added by the admin.`, amount });
  return null;
}

export function setCash(s: GameState, amount: number): ActionResult {
  if (!Number.isFinite(amount) || amount < 0) return 'Enter an amount of 0 or more.';
  const before = s.cash;
  s.cash = Math.round(amount);
  emit(s, null, { tone: 'info', title: 'Cash set by the admin', detail: `${money(before)} → ${money(s.cash)}.` });
  return null;
}

// ── Vehicles ──────────────────────────────────────────────────────────────

export interface PurchaseOptions {
  /** Work straight away, or park it. */
  assignment: Assignment;
  driver: DriverKind;
}

export function buyNew(s: GameState, modelId: VehicleModelId, opts: PurchaseOptions): ActionResult {
  const model = vehicleModel(modelId);
  return addVehicle(s, modelId, model.price, 0, false, opts);
}

export function buyUsed(s: GameState, listingId: string, opts: PurchaseOptions): ActionResult {
  const listing = s.market.listings.find((l) => l.id === listingId);
  if (!listing) return 'This vehicle was already sold.';
  const error = addVehicle(s, listing.modelId, listing.price, listing.km, true, opts);
  if (!error) s.market.listings = s.market.listings.filter((l) => l.id !== listingId);
  return error;
}

function addVehicle(
  s: GameState,
  modelId: VehicleModelId,
  price: number,
  km: number,
  used: boolean,
  opts: PurchaseOptions,
): ActionResult {
  const model = vehicleModel(modelId);
  if (!isOpen(s, model.businessId)) return `Open the ${businessInfo(model.businessId).name} first.`;
  if (s.cash < price) return 'Not enough cash.';
  const v: Vehicle = {
    id: uid(),
    businessId: model.businessId,
    modelId,
    name: `${CLASS_LABEL[model.class]} #${s.nextVehicleNumber++}`,
    plate: plateNumber(),
    purchasePrice: price,
    purchasedAt: s.clock,
    boughtUsed: used,
    km,
    // A used vehicle comes with an unknown service history: assume it is due soon.
    kmAtLastService: used ? Math.max(0, km - Math.round(model.serviceIntervalKm * Math.random())) : 0,
    assignment: opts.assignment === 'idle' ? 'idle' : workingJob(model),
    driver: 'hired',
    status: 'active',
    breakdown: null,
    garage: null,
    lifetime: { revenue: 0, costs: 0, breakdowns: 0 },
  };
  s.vehicles = [...s.vehicles, v];
  book(s, null, 'vehicles', -price, v.businessId);
  if (opts.driver === 'owner' && v.assignment === 'delivery') setDriver(s, v.id, 'owner');
  emit(s, null, {
    tone: 'info',
    title: `Bought ${v.name}`,
    detail: `${modelName(model)}${used ? `, used (${Math.round(km).toLocaleString('en-US')} km)` : ', brand new'} for ${money(price)}.`,
    vehicleId: v.id,
    amount: -price,
  });
  return null;
}

function find(s: GameState, id: string): Vehicle | undefined {
  return s.vehicles.find((v) => v.id === id);
}

/** Put a vehicle to work (its business's job) or park it. */
export function setAssignment(s: GameState, id: string, assignment: Assignment): ActionResult {
  const v = find(s, id);
  if (!v) return 'Vehicle not found.';
  v.assignment = assignment === 'idle' ? 'idle' : workingJob(vehicleModel(v.modelId));
  // You can only drive what is on delivery.
  if (v.assignment !== 'delivery' && v.driver === 'owner') v.driver = 'hired';
  return null;
}

/** You can drive one delivery vehicle yourself: no wage, but only one at a time. */
export function setDriver(s: GameState, id: string, driver: DriverKind): ActionResult {
  const v = find(s, id);
  if (!v) return 'Vehicle not found.';
  if (driver === 'owner') {
    if (v.assignment !== 'delivery') return 'You can only drive a vehicle that is on delivery.';
    for (const other of s.vehicles) if (other.driver === 'owner') other.driver = 'hired';
  }
  v.driver = driver;
  return null;
}

export function repair(s: GameState, id: string, express: boolean): ActionResult {
  const v = find(s, id);
  if (!v) return 'Vehicle not found.';
  if (v.status !== 'broken' || !v.breakdown) return 'This vehicle does not need a repair.';
  const quote = repairQuote(v.breakdown, express);
  if (s.cash < quote.cost) return 'Not enough cash.';
  book(s, v, 'repairs', -quote.cost);
  v.status = 'in-garage';
  v.garage = { job: 'repair', readyAt: s.clock + quote.hours, hours: quote.hours };
  emit(s, null, {
    tone: 'info',
    title: `${v.name} is at the garage`,
    detail: `${v.breakdown.label}${express ? ' (express)' : ''} — ready in ${quote.hours} h.`,
    vehicleId: v.id,
    amount: -quote.cost,
  });
  return null;
}

/** Every broken vehicle (of one business, or all), at the normal repair price. */
export function brokenVehicles(s: GameState, businessId?: BusinessId): Vehicle[] {
  return s.vehicles.filter((v) => v.status === 'broken' && v.breakdown && (!businessId || v.businessId === businessId));
}

/** Sends every broken vehicle to the garage at once — all of them, or none if cash is short. */
export function repairAll(s: GameState, businessId?: BusinessId): ActionResult {
  const broken = brokenVehicles(s, businessId);
  if (!broken.length) return 'Nothing to repair.';
  const total = broken.reduce((sum, v) => sum + v.breakdown!.cost, 0);
  if (s.cash < total) return `The repairs cost ${money(total)}. Not enough cash.`;
  for (const v of broken) {
    const quote = repairQuote(v.breakdown!, false);
    book(s, v, 'repairs', -quote.cost);
    v.status = 'in-garage';
    v.garage = { job: 'repair', readyAt: s.clock + quote.hours, hours: quote.hours };
  }
  emit(s, null, {
    businessId,
    tone: 'success',
    title: `${broken.length} vehicle${broken.length > 1 ? 's' : ''} sent to the garage`,
    detail: `Repairs paid: ${money(total)}.`,
    amount: -total,
  });
  return null;
}

export function service(s: GameState, id: string): ActionResult {
  const v = find(s, id);
  if (!v) return 'Vehicle not found.';
  if (v.status !== 'active') return 'Only a working vehicle can be serviced.';
  const model = vehicleModel(v.modelId);
  if (s.cash < model.serviceCost) return 'Not enough cash.';
  book(s, v, 'repairs', -model.serviceCost);
  v.status = 'in-garage';
  v.garage = { job: 'service', readyAt: s.clock + GAME.serviceHours, hours: GAME.serviceHours };
  emit(s, null, {
    tone: 'info',
    title: `${v.name} is being serviced`,
    detail: `Oil, filters and checks — ready in ${GAME.serviceHours} h.`,
    vehicleId: v.id,
    amount: -model.serviceCost,
  });
  return null;
}

export function overhaul(s: GameState, id: string): ActionResult {
  const v = find(s, id);
  if (!v) return 'Vehicle not found.';
  if (v.status !== 'worn-out') return 'Only a worn-out vehicle needs an overhaul.';
  const cost = overhaulCost(vehicleModel(v.modelId));
  if (s.cash < cost) return 'Not enough cash.';
  book(s, v, 'repairs', -cost);
  v.status = 'in-garage';
  v.garage = { job: 'overhaul', readyAt: s.clock + GAME.overhaulHours, hours: GAME.overhaulHours };
  emit(s, null, {
    tone: 'info',
    title: `${v.name} goes in for an overhaul`,
    detail: `New engine and drivetrain — back in ${GAME.overhaulHours / 24} days with 0 km.`,
    vehicleId: v.id,
    amount: -cost,
  });
  return null;
}

export function sell(s: GameState, id: string): ActionResult {
  const v = find(s, id);
  if (!v) return 'Vehicle not found.';
  if (v.status === 'in-garage') return 'Wait until it is out of the garage.';
  const price = v.status === 'worn-out' ? scrapValue(vehicleModel(v.modelId)) : sellValue(v);
  s.vehicles = s.vehicles.filter((x) => x.id !== id);
  book(s, null, 'sales', price, v.businessId);
  emit(s, null, {
    tone: 'info',
    businessId: v.businessId,
    title: `Sold ${v.name}`,
    detail: `${v.status === 'worn-out' ? 'Scrapped' : 'Sold to a dealer'} for ${money(price)}.`,
    amount: price,
  });
  return null;
}

export function rename(s: GameState, id: string, name: string): ActionResult {
  const v = find(s, id);
  if (!v) return 'Vehicle not found.';
  const trimmed = name.trim().slice(0, 24);
  if (!trimmed) return 'A name cannot be empty.';
  v.name = trimmed;
  return null;
}

// ── Restaurants & gas stations ────────────────────────────────────────────

/** Buys a new site at a random address. */
export function buyProperty(s: GameState, typeId: PropertyTypeId): ActionResult {
  const type = propertyType(typeId);
  if (!isOpen(s, type.businessId)) return `Open the ${businessInfo(type.businessId).name} first.`;
  if (s.cash < type.price) return 'Not enough cash.';
  const taken = s.properties.map((p) => p.address);
  const p: Property = {
    id: uid(),
    businessId: type.businessId,
    typeId,
    address: typeId === 'highway' ? roadAddress(taken) : streetAddress(taken),
    partner: type.businessId === 'gas-stations' ? pick(FUEL_BRANDS) : undefined,
    level: 1,
    purchasePrice: type.price,
    invested: type.price,
    purchasedAt: s.clock,
    earned: 0,
  };
  s.properties = [...s.properties, p];
  book(s, null, 'properties', -type.price, type.businessId);
  emit(s, null, {
    businessId: type.businessId,
    tone: 'success',
    title: `New ${type.name} opened`,
    detail: `${p.partner ? p.partner + ' · ' : ''}${p.address} — ${type.staff} workers hired.`,
    amount: -type.price,
  });
  return null;
}

/** Next level: more workers, more income. */
export function upgradeProperty(s: GameState, id: string): ActionResult {
  const p = s.properties.find((x) => x.id === id);
  if (!p) return 'Not found.';
  const cost = upgradeCost(p);
  if (cost === null) return `Already at level ${MAX_PROPERTY_LEVEL}.`;
  if (s.cash < cost) return 'Not enough cash.';
  const type = propertyType(p.typeId);
  book(s, null, 'upgrades', -cost, p.businessId);
  p.level++;
  p.invested += cost;
  emit(s, null, {
    businessId: p.businessId,
    tone: 'success',
    title: `${type.name} on ${p.address} is now level ${p.level}`,
    detail: `${type.levelPerk}, more customers.`,
    amount: -cost,
  });
  return null;
}

export function sellProperty(s: GameState, id: string): ActionResult {
  const p = s.properties.find((x) => x.id === id);
  if (!p) return 'Not found.';
  const price = propertySellValue(p);
  s.properties = s.properties.filter((x) => x.id !== id);
  book(s, null, 'sales', price, p.businessId);
  emit(s, null, {
    businessId: p.businessId,
    tone: 'info',
    title: `Sold the ${propertyType(p.typeId).name} on ${p.address}`,
    detail: `For ${money(price)}.`,
    amount: price,
  });
  return null;
}
