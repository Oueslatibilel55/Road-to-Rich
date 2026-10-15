import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { BUSINESSES } from '../data/businesses';
import { GAME } from '../data/game-constants';
import { vehicleModel } from '../data/vehicle-catalog';
import * as actions from '../engine/actions';
import { restockListings } from '../engine/market';
import { propertyIncomePerDay, propertyValue } from '../engine/property-rules';
import { advance, emptyDay, emptyLedger } from '../engine/simulation';
import { dailyEstimate, marketValue } from '../engine/vehicle-rules';
import {
  Assignment,
  BusinessId,
  DriverKind,
  GameSpeed,
  GameState,
  Ledger,
  Property,
  PropertyTypeId,
  Vehicle,
  VehicleModelId,
} from '../models/game.models';
import { ToastService } from './toast.service';

const SAVE_KEY = 'road-to-rich:save';

export interface BusinessStats {
  /** Vehicles + sites owned. */
  assets: number;
  /** Of which earning right now. */
  working: number;
  /** Broken down or worn out: what blocks income and needs the player. */
  alerts: number;
  /** What everything owned is worth. */
  assetValue: number;
  /** Expected net income per day as things stand, if nothing breaks. */
  incomePerDay: number;
  today: Ledger;
}

function summarize(vehicles: Vehicle[], properties: Property[], today: Ledger | undefined): BusinessStats {
  const stats: BusinessStats = { assets: 0, working: 0, alerts: 0, assetValue: 0, incomePerDay: 0, today: today ?? emptyLedger() };
  for (const v of vehicles) {
    const model = vehicleModel(v.modelId);
    stats.assets++;
    if (v.status === 'active' && v.assignment !== 'idle') stats.working++;
    if (v.status === 'broken' || v.status === 'worn-out') stats.alerts++;
    stats.assetValue += marketValue(model, v.km);
    stats.incomePerDay += dailyEstimate(model, v.status === 'active' ? v.assignment : 'idle', v.driver).net;
  }
  for (const p of properties) {
    stats.assets++;
    stats.working++;
    stats.assetValue += propertyValue(p);
    stats.incomePerDay += propertyIncomePerDay(p);
  }
  return stats;
}

/** v1 had no business ownership: every vehicle was the Delivery Company's. */
function migrateV1(s: GameState): GameState {
  for (const v of s.vehicles) v.businessId = 'delivery';
  if (s.vehicles.length && s.businesses.delivery.openedAt === null) s.businesses.delivery.openedAt = s.clock;
  for (const e of s.events) if (e.vehicleId) e.businessId = 'delivery';
  // Per-business money did not exist: start the reports fresh.
  s.today = emptyDay(s.clock);
  s.history = [];
  s.version = 2;
  return s;
}

/** v2 → v3: new businesses and properties; delivery vehicles no longer rent out. */
function migrateV2(s: GameState): GameState {
  const old = s.businesses as Partial<GameState['businesses']>;
  s.businesses = actions.closedBusinesses();
  for (const b of BUSINESSES) if (old[b.id]) s.businesses[b.id] = old[b.id]!;
  s.properties = [];
  for (const v of s.vehicles) if (v.assignment === 'rental') v.assignment = 'delivery';
  s.market = { listings: restockListings(), refreshAt: s.clock + GAME.marketRefreshHours };
  s.version = 3;
  return s;
}

/**
 * The single source of truth for the demo. Holds the GameState in a signal, runs the
 * clock, and exposes player commands. When the backend arrives, the commands become HTTP
 * calls and the tick becomes a client-side prediction between syncs.
 */
@Injectable({ providedIn: 'root' })
export class GameStore {
  private readonly toasts = inject(ToastService);
  private readonly state = signal<GameState>(this.load());

  readonly snapshot = this.state.asReadonly();
  readonly cash = computed(() => this.state().cash);
  readonly clock = computed(() => this.state().clock);
  readonly speed = computed(() => this.state().speed);
  readonly vehicles = computed(() => this.state().vehicles);
  readonly properties = computed(() => this.state().properties);
  readonly events = computed(() => this.state().events);
  readonly market = computed(() => this.state().market);
  readonly today = computed(() => this.state().today);
  readonly ownerVehicle = computed(() => this.vehicles().find((v) => v.driver === 'owner') ?? null);

  /** Businesses the player has opened, in catalogue order. */
  readonly openBusinesses = computed(() => BUSINESSES.filter((b) => this.isOpen(b.id)));

  /** What the UI shows about each business, keyed by id. */
  readonly businessStats = computed(() => {
    const today = this.today();
    const stats = {} as Record<BusinessId, BusinessStats>;
    for (const b of BUSINESSES) {
      stats[b.id] = summarize(
        this.vehicles().filter((v) => v.businessId === b.id),
        this.properties().filter((p) => p.businessId === b.id),
        today.byBusiness[b.id],
      );
    }
    return stats;
  });

  /** The whole company: every business added up. */
  readonly totals = computed(() => summarize(this.vehicles(), this.properties(), this.today()));
  readonly incomePerDay = computed(() => this.totals().incomePerDay);
  readonly netWorth = computed(() => this.cash() + this.totals().assetValue);

  private lastTick = performance.now();
  private lastSave = 0;

  constructor() {
    const timer = setInterval(() => this.tick(), 250);
    const onHide = () => {
      if (document.hidden) this.save();
      // The world pauses while the tab is hidden; don't credit that time on return.
      this.lastTick = performance.now();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', () => this.save());
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
    });
  }

  isOpen(id: BusinessId): boolean {
    return this.state().businesses[id]?.openedAt != null;
  }

  // ── Clock ────────────────────────────────────────────────────────────────

  private tick(): void {
    const now = performance.now();
    const realSeconds = Math.min(1, (now - this.lastTick) / 1000);
    this.lastTick = now;
    const s = this.state();
    if (document.hidden || s.speed === 0) return;

    const draft = structuredClone(s);
    const events = advance(draft, realSeconds * GAME.hoursPerSecondAt1x * s.speed);
    this.state.set(draft);
    for (const e of events) {
      const link = e.tone === 'danger' && e.vehicleId && e.businessId ? `/b/${e.businessId}/v/${e.vehicleId}` : undefined;
      this.toasts.show(e.tone, e.title, e.detail, link);
    }

    if (now - this.lastSave > 3000) this.save();
  }

  setSpeed(speed: GameSpeed): void {
    this.mutate((s) => {
      s.speed = speed;
      return null;
    });
  }

  // ── Commands ─────────────────────────────────────────────────────────────

  openBusiness(id: BusinessId) {
    return this.run((s) => actions.openBusiness(s, id));
  }
  buyNew(modelId: VehicleModelId, opts: actions.PurchaseOptions) {
    return this.run((s) => actions.buyNew(s, modelId, opts), 'Vehicle bought');
  }
  buyUsed(listingId: string, opts: actions.PurchaseOptions) {
    return this.run((s) => actions.buyUsed(s, listingId, opts), 'Vehicle bought');
  }
  setAssignment(id: string, assignment: Assignment) {
    return this.run((s) => actions.setAssignment(s, id, assignment));
  }
  setDriver(id: string, driver: DriverKind) {
    return this.run((s) => actions.setDriver(s, id, driver));
  }
  repair(id: string, express: boolean) {
    return this.run((s) => actions.repair(s, id, express), 'Sent to the garage');
  }
  service(id: string) {
    return this.run((s) => actions.service(s, id), 'Service booked');
  }
  overhaul(id: string) {
    return this.run((s) => actions.overhaul(s, id), 'Overhaul booked');
  }
  sell(id: string) {
    return this.run((s) => actions.sell(s, id), 'Vehicle sold');
  }
  rename(id: string, name: string) {
    return this.run((s) => actions.rename(s, id, name));
  }
  buyProperty(typeId: PropertyTypeId) {
    return this.run((s) => actions.buyProperty(s, typeId));
  }
  upgradeProperty(id: string) {
    return this.run((s) => actions.upgradeProperty(s, id));
  }
  sellProperty(id: string) {
    return this.run((s) => actions.sellProperty(s, id));
  }

  repairAll(businessId?: BusinessId) {
    return this.run((s) => actions.repairAll(s, businessId));
  }

  // Admin (testing)
  grantTestCash(amount: number) {
    return this.run((s) => actions.grantTestCash(s, amount));
  }
  setCash(amount: number) {
    return this.run((s) => actions.setCash(s, amount));
  }

  resetGame(): void {
    this.state.set(actions.newGame());
    this.save();
    this.toasts.show('info', 'New game', 'Back to $50,000 and no businesses.');
  }

  /** Runs a command on a copy; commits it on success, toasts the error otherwise. */
  private run(command: (s: GameState) => actions.ActionResult, success?: string): boolean {
    const before = this.state().events[0]?.id;
    const error = this.mutate(command);
    if (error) {
      this.toasts.show('warning', "Can't do that", error);
      return false;
    }
    // Toast what the command recorded (e.g. "Pizzeria opened"), else the generic message.
    const event = this.state().events[0];
    if (event && event.id !== before) this.toasts.show(event.tone === 'info' ? 'success' : event.tone, event.title, event.detail);
    else if (success) this.toasts.show('success', success);
    return true;
  }

  private mutate(command: (s: GameState) => actions.ActionResult): actions.ActionResult {
    const draft = structuredClone(this.state());
    const error = command(draft);
    if (!error) {
      this.state.set(draft);
      this.save();
    }
    return error;
  }

  // ── Persistence (localStorage until the backend exists) ──────────────────

  private load(): GameState {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        let parsed = JSON.parse(raw) as GameState;
        if (parsed.version === 1) parsed = migrateV1(parsed);
        if (parsed.version === 2) parsed = migrateV2(parsed);
        if (parsed.version === actions.SAVE_VERSION) return parsed;
      }
    } catch {
      /* corrupted or blocked storage: start fresh */
    }
    return actions.newGame();
  }

  private save(): void {
    this.lastSave = performance.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state()));
    } catch {
      /* storage full or blocked: the game keeps running, it just won't persist */
    }
  }
}
