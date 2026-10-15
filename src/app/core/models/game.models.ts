// Domain types. These are the shapes a backend will later own and send as JSON
// (camelCase, enums as strings) — keep them serializable: no classes, no Dates.

/** Game time is a number of game hours since the start of the game. */
export type GameHours = number;

export type BusinessId = 'delivery' | 'car-rental' | 'restaurants' | 'gas-stations' | 'real-estate';

// ── Vehicles (Delivery Company, Car Rental) ───────────────────────────────

export type VehicleModelId = string;

export type VehicleClass = 'scooter' | 'car' | 'premium' | 'van' | 'truck' | 'semi';

export interface VehicleModel {
  id: VehicleModelId;
  /** The business that sells and uses this model. */
  businessId: BusinessId;
  brand: string;
  model: string;
  class: VehicleClass;
  /** New price, USD. */
  price: number;
  /** Set for delivery vehicles. */
  delivery?: {
    /** Km driven per working hour on a delivery shift. */
    kmPerHour: number;
    /** Delivery fees collected per working hour. */
    revenuePerHour: number;
    /** Fuel or energy, USD per km. */
    fuelPerKm: number;
    /** What a hired driver costs per working hour. */
    driverWagePerHour: number;
  };
  /** Set for rental cars. */
  rental?: {
    /** Rent collected per day. Renters pay the fuel. */
    ratePerDay: number;
    /** Km renters drive per day on average. */
    kmPerDay: number;
  };
  /** Insurance and registration, USD per day, paid for every owned vehicle. */
  insurancePerDay: number;
  /** A service (oil, filters, checks) is due every this many km. */
  serviceIntervalKm: number;
  serviceCost: number;
  /** Average km between breakdowns for a new, serviced vehicle. */
  kmBetweenBreakdowns: number;
}

/** What a vehicle does: deliver (Delivery Company), rent out (Car Rental), or stay parked. */
export type Assignment = 'idle' | 'delivery' | 'rental';
export type DriverKind = 'hired' | 'owner';

export type VehicleStatus =
  | 'active'     // can work
  | 'broken'     // breakdown — earns nothing until the player pays for a repair
  | 'in-garage'  // repair, service or overhaul under way
  | 'worn-out';  // reached the km limit — overhaul or scrap

export type GarageJob = 'repair' | 'service' | 'overhaul';

export type BreakdownSeverity = 'minor' | 'major' | 'critical';

export interface BreakdownType {
  id: string;
  label: string;
  severity: BreakdownSeverity;
  /** Repair cost as a share of the model's new price … */
  costShare: number;
  /** … but never below this. */
  minCost: number;
  /** Garage time, game hours. */
  hours: number;
  /** Relative odds on a new vehicle. */
  weight: number;
  /** Extra odds on a vehicle near the km limit (scaled by km / limit). */
  wearWeight: number;
}

export interface Breakdown {
  typeId: string;
  label: string;
  severity: BreakdownSeverity;
  cost: number;
  hours: number;
  at: GameHours;
}

export interface Vehicle {
  id: string;
  /** The business that owns it. */
  businessId: BusinessId;
  modelId: VehicleModelId;
  name: string;
  plate: string;
  purchasePrice: number;
  purchasedAt: GameHours;
  boughtUsed: boolean;
  km: number;
  kmAtLastService: number;
  assignment: Assignment;
  driver: DriverKind;
  status: VehicleStatus;
  breakdown: Breakdown | null;
  garage: { job: GarageJob; readyAt: GameHours; hours: number } | null;
  lifetime: { revenue: number; costs: number; breakdowns: number };
}

export interface UsedListing {
  id: string;
  modelId: VehicleModelId;
  km: number;
  price: number;
  seller: string;
}

// ── Properties (Restaurant Chain, Gas Stations) ───────────────────────────

export type PropertyTypeId = string;

export interface PropertyType {
  id: PropertyTypeId;
  businessId: BusinessId;
  name: string;
  /** Price of a new site, USD. */
  price: number;
  /** Net income per day at level 1. */
  incomePerDay: number;
  /** Workers at level 1, and how many each level adds. */
  staff: number;
  staffPerLevel: number;
  /** What a level adds, in words ("+2 pumps"). */
  levelPerk: string;
}

export interface Property {
  id: string;
  businessId: BusinessId;
  typeId: PropertyTypeId;
  /** Where it is: "24 Oak Street". */
  address: string;
  /** Fuel brand for a gas station. */
  partner?: string;
  level: number;
  purchasePrice: number;
  /** Price + every upgrade paid. */
  invested: number;
  purchasedAt: GameHours;
  earned: number;
}

// ── Company ───────────────────────────────────────────────────────────────

export interface BusinessState {
  openedAt: GameHours | null;
}

export type EventTone = 'info' | 'success' | 'warning' | 'danger';

export interface GameEvent {
  id: string;
  at: GameHours;
  tone: EventTone;
  title: string;
  detail: string;
  businessId?: BusinessId;
  vehicleId?: string;
  amount?: number;
}

export type LedgerCategory =
  | 'delivery'
  | 'rental'
  | 'sales-income'
  | 'fuel'
  | 'wages'
  | 'insurance'
  | 'repairs'
  | 'vehicles'
  | 'properties'
  | 'upgrades'
  | 'licenses'
  | 'sales';

export interface Ledger {
  income: number;
  costs: number;
  byCategory: Partial<Record<LedgerCategory, number>>;
}

export interface DayReport extends Ledger {
  day: number;
  /** The same money split by business. */
  byBusiness: Partial<Record<BusinessId, Ledger>>;
}

export type GameSpeed = 0 | 1 | 4 | 12;

export interface GameState {
  version: number;
  cash: number;
  clock: GameHours;
  speed: GameSpeed;
  businesses: Record<BusinessId, BusinessState>;
  vehicles: Vehicle[];
  properties: Property[];
  market: { listings: UsedListing[]; refreshAt: GameHours };
  events: GameEvent[];
  today: DayReport;
  history: DayReport[];
  totals: { earned: number; spent: number };
  /** Counter used to name vehicles ("Truck #3"). */
  nextVehicleNumber: number;
}
