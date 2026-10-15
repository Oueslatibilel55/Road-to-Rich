# Architecture

## Folders

```
src/app/
  core/
    models/game.models.ts    Domain types (GameState, Vehicle, …) — plain JSON shapes
    data/                    Static content and rules' numbers
      game-constants.ts        Time, limits, shares (GAME)
      vehicle-catalog.ts       Real makes and models, for Delivery and Car Rental
      property-catalog.ts      Restaurant and gas station types, fuel brands
      breakdowns.ts            Breakdown table
      businesses.ts            The businesses, their licence price and kind
    engine/                  Pure game logic — no Angular, no DOM
      clock.ts                 Day/hour helpers, shift overlap
      vehicle-rules.ts         Wear, risk, breakdown roll, values, daily income
      property-rules.ts        Site income, workers, upgrade cost, value
      locations.ts             Random street / highway addresses
      market.ts                Used-lot listings per vehicle business
      simulation.ts            advance(state, hours): the game loop
      actions.ts               Player commands (open, buy, upgrade, repair, sell…)
      random.ts                ids, random helpers
    state/
      game.store.ts            Signal store: holds GameState, runs the clock, saves, migrates
      toast.service.ts
    util/format.ts           Money / km / game-time pipes
  shared/                    business-card, open-business-list, attention-list,
                             activity-list, vehicle-card, vehicle-status, modal, toasts, icons
  layout/                    Speed control
  features/
    home/                    / — cash, income/day, my businesses, open a new one
    businesses/              /businesses — mine + open a new one
    activity/                /activity — every event, filter by business
    admin/                   /admin — testing: add / set cash, reset the account
    business/                /b/:businessId/… — the same pages for every business
      business-layout          header (name, income/day) + 2 tabs
      mine.page                what it owns: vehicle cards or site cards
      buy.page                 its shop: vehicles (new / used) or sites
      vehicle.page             one vehicle: status, job, mileage, repair, sell
      property-card            one site: address, level, workers, upgrade
  app.component.ts           Shell: sidebar (desktop), top bar, tab bar (phone)
docs/                        This folder
```

## Organized by business

The player runs several businesses, so ownership is explicit everywhere:

- `Vehicle.businessId` / `Property.businessId` — the business that owns it.
- `GameEvent.businessId` — set from the vehicle when there is one.
- `DayReport.byBusiness[id]` — the same income/costs/categories as the company total, per
  business. `simulation.book()` fills both.
- The UI mirrors it: `/` is the company, `/b/<id>/…` is one business. A business's pages
  only open once it is open (`businessOpen` guard in `app.routes.ts`).

Save format history, migrated on load: **v1 → v2** gave vehicles and events a business;
**v2 → v3** added the new businesses and `properties`, and moved delivery vehicles that
were rented out back to delivery (renting is the Car Rental's job now).

## How state flows

```
          ┌───────────── GameStore (signal<GameState>) ─────────────┐
 tick ───►│ clone → engine/simulation.advance(draft, hours) → set   │──► computed() ──► templates
 click ──►│ clone → engine/actions.<command>(draft)          → set  │
          └──────────────────── localStorage ───────────────────────┘
```

- One signal holds the whole `GameState`. Components read it through `computed()`s.
- A `setInterval` (250 ms) advances the clock by `realSeconds × speed` game hours. Hidden
  tabs don't tick.
- Commands (`buyNew`, `repair`, …) run on a clone and return `string | null`. On success
  the clone becomes the state and is saved; on error a toast shows the message.
- Saved to `localStorage` (`road-to-rich:save`) every 3 s, after each command, and when the
  tab is hidden. `version` guards the format: v1 is migrated, anything else unknown starts
  a new game.

## Plan for the backend

The engine was written to move. Expected shape when the backend arrives (likely .NET,
like RichLife, but nothing is decided):

1. **Server owns the state and the clock.** `GameState` becomes database rows; the
   engine's rules (`vehicle-rules.ts`, `simulation.ts`, `actions.ts`) are ported
   server-side. The server simulates elapsed time on each request, which also gives
   **offline progress** (with a cap).
2. **Catalogue from the API.** `core/data/*` becomes `GET /api/catalogue/vehicles`,
   `/breakdowns`, `/businesses`, editable by an admin.
3. **Commands become HTTP calls.** Each `GameStore` command maps to an endpoint and keeps its
   contract — `200` with the new state, or `400` with a message string:

   | Store command | Endpoint (sketch) |
   |---|---|
   | `openBusiness(id)` | `POST /api/businesses/{id}/open` |
   | `buyNew(modelId, opts)` | `POST /api/dealership/new/{modelId}` |
   | `buyUsed(listingId, opts)` | `POST /api/dealership/used/{listingId}` |
   | `setAssignment(id, job)` | `PUT /api/vehicles/{id}/assignment` |
   | `setDriver(id, driver)` | `PUT /api/vehicles/{id}/driver` |
   | `repair(id, express)` | `POST /api/vehicles/{id}/repair` |
   | `service(id)` / `overhaul(id)` | `POST /api/vehicles/{id}/service` · `/overhaul` |
   | `sell(id)` | `DELETE /api/vehicles/{id}` |

4. **The client tick stays as a prediction** between server syncs, so the UI keeps moving;
   the server's answer always wins. Breakdowns are rolled **server-side only**.
5. Auth, a leaderboard and an API contract doc (`docs/api-contract.md`) come with it.

Until then, nothing in the UI talks to a server.
