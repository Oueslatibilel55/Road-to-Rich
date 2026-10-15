# Game design — rules and numbers

Source of truth for the rules. The code that applies them is `src/app/core/engine/`;
the numbers are in `src/app/core/data/`. Change this file and the code together.

**The player sees little of this.** The UI shows what matters: cash, income per day,
prices, status (working / broken / at the garage), mileage and levels. Costs such as fuel,
wages and insurance are simulated but only appear inside the "income per day" figure.

## 1. Time

- The game runs on a **game clock** counted in game hours. It starts on **day 1 at 07:00**.
- At speed **1×**, one real second is **one game hour** (a game day is 24 s). Speeds:
  pause, 1×, 4×, 12×.
- The engine advances in steps of at most 15 game minutes and never across midnight, so
  each day's report holds exactly that day's money.
- **The world pauses while the tab is hidden or closed.** There are no offline earnings
  in the demo (see `roadmap.md`).

## 2. Money

- Start with **$50,000** cash. Prices are realistic US prices.
- Cash is shared by the whole company; each business keeps its own accounts.
- Cash can go below zero only through running costs (insurance). You cannot buy anything
  you cannot pay for.
- **Net worth** = cash + what everything owned is worth (vehicles at market value, sites
  at 70 % of what was put into them).
- **Income / day** = the expected net of everything owned as it is set up now (after fuel,
  wages and insurance), if nothing breaks.

**Admin (testing)** — `/admin`: add money (+$100K / +$1M / +$10M), set cash to an exact
amount, reset the account. Admin money changes cash only; it is not earnings. Open to
everyone in the demo; admin-only once there is a backend.

## 3. Businesses

Opening a business costs a **licence**, so you can't open them all at the start:

| Business | Licence | Owns | Earns from |
|---|---|---|---|
| Delivery Company | free | vehicles | delivery shifts, 08:00–20:00 |
| Car Rental | $20,000 | cars | daily rent, around the clock |
| Restaurant Chain | $120,000 | restaurants | customers, around the clock |
| Gas Stations | $300,000 | stations | fuel and shop sales, around the clock |
| Real Estate | $1,000,000 | — | coming soon |

## 4. Vehicles — Delivery Company and Car Rental

A vehicle **works** (delivers, or is rented out) or is **parked** (earns nothing, no wear).
Every owned vehicle pays **insurance** every day, whatever it does.

**Delivery driver.** A delivery vehicle has a hired driver (paid per working hour) or
**you**. You can drive **one** vehicle at a time and cost no wage.

### Delivery Company

| Model | Price | km/h · fees/h · fuel/km · wage/h | Insurance/day | Service every · cost | Km between breakdowns | Income/day (hired / you drive) |
|---|---|---|---|---|---|---|
| Honda PCX 125 | 3,500 | 25 · 26 · 0.05 · 14 | 2 | 6,000 · 120 | 6,000 | $127 / $295 |
| Toyota Corolla | 22,000 | 30 · 48 · 0.10 · 17 | 6 | 15,000 · 280 | 10,000 | $330 / $534 |
| Ford Transit | 46,000 | 35 · 85 · 0.16 · 19 | 10 | 20,000 · 450 | 11,000 | $715 / $943 |
| Isuzu NPR-HD Box Truck | 90,000 | 45 · 160 · 0.32 · 24 | 18 | 25,000 · 900 | 12,000 | $1,441 / $1,729 |
| Volvo VNL 860 | 165,000 | 65 · 290 · 0.55 · 30 | 30 | 40,000 · 1,600 | 15,000 | $2,661 / $3,021 |

A delivery vehicle pays itself back in about two months of game time.

### Car Rental

Renters pay the fuel. Insurance is 0.04 % of the price per day; a service (every 15,000 km)
costs 1.2 % of the price (min $200); 14,000 km between breakdowns on average.

| Car | Price | Rent/day | Km/day |
|---|---|---|---|
| Dacia Sandero | 17,000 | 175 | 160 |
| Toyota Corolla | 23,000 | 235 | 170 |
| Volkswagen Golf | 28,000 | 285 | 170 |
| Tesla Model 3 | 42,000 | 430 | 180 |
| BMW 3 Series | 46,000 | 475 | 170 |
| Mercedes-Benz E-Class | 63,000 | 650 | 170 |
| Land Rover Range Rover Sport | 85,000 | 880 | 160 |
| Porsche 911 Carrera | 120,000 | 1,250 | 120 |

Rents are tuned for pace, not realism: a car pays itself back in about 100 days.

## 5. Wear, service and breakdowns (all vehicles)

- **Odometer.** At **1,000,000 km** the vehicle is **worn out**: it stops, and you either
  **overhaul** it (35 % of the new price, 3 days at the garage, odometer back to 0) or
  **scrap** it (4 % of the new price).
- **Service.** Due every `serviceIntervalKm`. Takes **4 h**. "Service due" shows at 90 %.
- **Breakdown risk** multiplies the base rate:
  `risk = (1 + 2.5 × (km / 1M)²) × (1 + 1.5 × overdue)`, capped at ×8, where `overdue`
  is how many service intervals past due it is.
- **Breakdowns happen while driving.** Over `d` km the chance is
  `1 − e^(−d / kmBetweenBreakdowns × risk)`. A parked vehicle never breaks down.
- **A broken vehicle earns nothing** until you pay for a repair; it then spends the repair
  time at the garage and goes back to work. **Fast repair**: ×1.6 the cost, 40 % of the time.
- **Repair all** (Home: every business; a business's page: that business) lists each broken
  vehicle with its breakdown and cost, and the total. It repairs all of them at the normal
  price, or none if the cash does not cover the total.

### Breakdown table

Cost = max(minimum, share × new price) × a random 0.85–1.2, rounded to $5. Odds = weight +
wear weight × (km / 1M), so worn vehicles lean towards the expensive failures.

| Breakdown | Severity | Share of price | Min | Garage time | Weight | Wear weight |
|---|---|---|---|---|---|---|
| Flat tyre | minor | 0.3 % | $40 | 2 h | 30 | 0 |
| Dead battery | minor | 0.6 % | $90 | 3 h | 20 | 4 |
| Worn-out brakes | major | 1.2 % | $150 | 6 h | 15 | 8 |
| Electrical fault | major | 1.5 % | $200 | 8 h | 10 | 6 |
| Engine overheating | major | 2 % | $250 | 10 h | 12 | 10 |
| Clutch failure | major | 3.5 % | $400 | 18 h | 6 | 10 |
| Gearbox failure | critical | 6 % | $600 | 36 h | 4 | 14 |
| Engine failure | critical | 10 % | $900 | 72 h | 2 | 16 |

### Buying and selling vehicles

- **New**: list price, 0 km.
- **Used lot**: 4 listings per vehicle business, restocked every **3 game days**. A quarter
  are near the end of their life (750,000–985,000 km), the rest 15,000–750,000 km; cheaper
  models show up more often. Price = market value × a random 0.92–1.08. A used vehicle's
  service history is unknown.
- **Market value** = `price × 0.9 × (1 − km / 1.1M)^1.4`, never below 8 % of the price.
- **Selling** pays 90 % of market value, minus the repair if it is broken. A worn-out
  vehicle only goes for scrap. A vehicle at the garage cannot be sold.

## 6. Sites — Restaurant Chain and Gas Stations

You buy a site; it opens at a **random address** (a street in town, or a highway exit
for a highway service area). A gas station gets a random **fuel brand partner** (Shell,
TotalEnergies, BP, Esso, Chevron, Texaco, Q8, Agip). Sites earn around the clock.

**Levels 1–10.** Each level adds workers (or pumps) and **+35 % of the base income**.
Going from level n to n+1 costs **25 % of the site price × 1.35^(n−1)**, so every level
costs more for the same gain.

| Site | Price | Income/day at level 1 | Workers (+ per level) |
|---|---|---|---|
| Burger Joint | 180,000 | 1,900 | 6 (+2) |
| Pizzeria | 260,000 | 2,700 | 8 (+2) |
| Sushi Bar | 380,000 | 3,900 | 10 (+3) |
| Steakhouse | 550,000 | 5,600 | 14 (+3) |
| Neighborhood Station | 650,000 | 6,500 | 4 (+1), +2 pumps per level |
| Town Station & Shop | 1,200,000 | 12,000 | 8 (+2), +2 pumps per level |
| Highway Service Area | 2,500,000 | 25,000 | 16 (+3), +4 pumps per level |

A site pays itself back in about 95–100 days at level 1. **Selling** a site pays 70 % of
everything put into it (price + upgrades).
