// Rules of the game in one place. Every number here is documented in docs/game-design.md —
// change both together.

export const GAME = {
  startingCash: 50_000,
  /** The game starts on day 1 at 07:00. */
  startClock: 7,

  /** Game hours that pass per real second at speed 1×. */
  hoursPerSecondAt1x: 1,
  /** The engine never advances more than this many game hours in one step. */
  maxStepHours: 0.25,

  /** Delivery shift, hours of the day. Delivery vehicles only earn inside it. */
  shiftStart: 8,
  shiftEnd: 20,

  /** A vehicle at this many km is worn out: overhaul or scrap. */
  kmLimit: 1_000_000,
  overhaulCostShare: 0.35,
  overhaulHours: 72,
  scrapValueShare: 0.04,
  serviceHours: 4,

  /** Express repair: this much more expensive, this share of the time. */
  expressCostFactor: 1.6,
  expressTimeFactor: 0.4,

  /** Selling to a dealer pays this share of market value. */
  dealerBuyBackShare: 0.9,

  /** Used market: listings per vehicle business, and how often the lot is restocked. */
  marketListings: 4,
  marketRefreshHours: 72,

  /** Kept for the overview chart. */
  historyDays: 14,
  maxEvents: 120,
} as const;

export const SPEEDS = [0, 1, 4, 12] as const;
