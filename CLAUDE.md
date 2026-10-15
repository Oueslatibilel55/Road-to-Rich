# Road to Rich — working on the code

Frontend-only demo of a business-management game. Angular 19, Tailwind 3, Lucide icons,
no backend yet. **Not related to RichLife** (`Desktop\back`): separate repo, separate
Netlify site, its own design. Don't copy RichLife code or styling into it.

Read first: `docs/game-design.md` (rules and numbers), `docs/architecture.md` (structure,
backend plan).

## Commands

The system Node is 18.18, too old for the Angular 19 CLI. Use a throwaway Node 20:

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx -y -p node@20 node node_modules/@angular/cli/bin/ng.js serve --port 4300   # 4300, not 4200: RichLife uses 4200
npx -y -p node@20 node node_modules/@angular/cli/bin/ng.js build
```

To exercise the engine without the UI, write a throwaway script that imports
`core/engine/*` and run it with `npx -y -p node@20 -p tsx@4 tsx <file>.ts` — the engine has
no Angular dependency.

## Rules

- **Game rules live in `core/engine/` and `core/data/`, never in components.** Components
  read from `GameStore` and call its commands. The engine is the part that moves to the
  backend later, so keep it pure TypeScript: no Angular imports, no DOM.
- **Every number is in `core/data/` and documented in `docs/game-design.md`.** Change both
  together. No magic numbers in templates (the 1,000,000 km limit is `GAME.kmLimit`).
- **State is serializable.** `GameState` is plain JSON — no classes, no `Date` (time is game
  hours, a number). It is what `localStorage` holds today and what the API will send.
- **Commands return `string | null`** — an error message or success — mirroring the future
  API's `400` + message. `GameStore.run` toasts the error.
- **Immutable updates.** The store clones the state (`structuredClone`), mutates the draft
  in the engine, then sets the signal. Never mutate `store.snapshot()` directly.
- Standalone components, `input()` / `output()` / `computed()`, `@if` / `@for`. Pages
  are lazy-loaded; inline templates are fine.

## Everything is organized by business

The game has several businesses (each with a licence price), so the app is built around them:

- **Each business owns its assets**: `Vehicle.businessId`, `Property.businessId`; events
  carry `businessId`; the day's money is split in `DayReport.byBusiness`. `book()` files
  money under the business. Anything new a business owns follows the same rule.
- **Two kinds of business** (`BusinessInfo.assets`): `vehicles` (Delivery Company, Car
  Rental — models in `vehicle-catalog.ts`, wear and breakdowns) and `properties`
  (Restaurant Chain, Gas Stations — site types in `property-catalog.ts`, levels).
- **One set of pages serves every business**: `/b/:businessId` (what it owns),
  `/b/:businessId/buy` (its shop), `/b/:businessId/v/:id` (a vehicle) — in
  `features/business/`, around `BusinessLayoutComponent` (header + 2 tabs). Pages get
  `businessId` as an input (`paramsInheritanceStrategy: 'always'`).
- **Adding a business**: an entry in `core/data/businesses.ts`, its models or site types in
  the catalogue, the id in the `BusinessId` union, and its icon in `BUSINESS_ICON`. If it
  is a new kind (neither vehicles nor sites), it needs its own engine rules and cards.
- `GameStore.businessStats()[id]` and `GameStore.totals()` give assets, working, alerts,
  asset value and income per day — use them rather than recomputing.

## Show only what matters

Like RichLife: the player sees **cash, income per day, prices, status, mileage and
levels** — one money figure per thing. No cost breakdowns, comparison tables, payback
times or risk multipliers on screen; the engine still simulates fuel, wages, insurance and
risk, and folds them into "income / day". Before adding a number to a screen, ask whether
the player needs it to decide something.

## Design

Light theme: warm paper background, white cards, deep teal accent — not RichLife's cool
grey and indigo. Semantic colours are CSS variables in `src/styles.css`, exposed by
`tailwind.config.js` as `canvas`, `surface`, `sunken`, `line`, `fg` / `fg-2` / `fg-3`;
accent `brand-*` (Tailwind teal), money `money-*`. Use these rather than raw greys, so a
dark theme later only changes the variables. Each business has an accent family
(`BUSINESS_THEME`). Reusable classes (`card`, `tile`, `btn-primary`, `btn-ghost`, `pill`,
`segmented`, `bar`, `label`, `num`, `h1`) are in `src/styles.css`. Numbers use `num`
(Space Grotesk, tabular). Icons come from `shared/icons.ts` — add new ones there. Status
colours: emerald = earning, sky = rented, amber = garage/warning, rose = broken.

Responsive: sidebar from `lg` (Home, My businesses, Open a business, Activity); below it
a 3-tab bar (Home, Businesses, Activity). Inside a business: two tabs, what you own and Buy. Modals are bottom sheets on phones (`shared/modal.component.ts`). Check
every screen at phone width.

Lucide gotcha: `lucide-icon` takes `class` as an input, so a `[class]` binding on it
clashes with a static `class`. Colour an icon through a wrapping element instead.
