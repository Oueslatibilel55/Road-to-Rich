# Roadmap

## Built (demo v0.1, 2026-10-15)

- Start with $50,000, game clock with pause / 1× / 4× / 12×.
- Delivery Company (free to open), 08:00–20:00 delivery shifts.
- 5 vehicles: scooter, hatchback, cargo van, box truck, semi truck.
- Jobs: delivery (hired driver or you), rent out, park.
- Odometer up to 1,000,000 km → overhaul or scrap.
- Service intervals; overdue service raises breakdown risk.
- Random breakdowns (8 types); vehicle stops earning until repaired; normal or express repair.
- New and used dealership (used lot restocks every 3 days).
- Sell to a dealer; market value falls with mileage.
- Overview (KPIs, alerts, daily result chart), fleet, vehicle detail, businesses, activity log.
- Saved in `localStorage`. Responsive: phone tab bar, desktop sidebar.

## v0.2 (2026-10-15)

- Light theme (warm paper, white cards, teal accent).
- Organized by business: each business owns its vehicles and keeps its own accounts;
  Home shows the company and one card per business; each business has its own pages
  (`/b/<id>`: dashboard, fleet, dealership, activity); the activity log filters by business.

## v0.3 (2026-10-15)

- Businesses cost a licence: Delivery free, Car Rental $20K, Restaurant Chain $120K,
  Gas Stations $300K (Real Estate coming).
- Real makes and models (Honda, Toyota, Ford, Isuzu, Volvo; Dacia, VW, Tesla, BMW,
  Mercedes-Benz, Land Rover, Porsche).
- Car Rental: buy cars and rent them out; they wear and break down like delivery vehicles.
- Restaurants and gas stations at random addresses; levels 1–10 add workers and income;
  stations get a fuel brand partner.
- Much simpler screens: cash and income per day first; each business has two tabs (what
  you own, Buy); cost breakdowns, charts and comparison tables removed. Delivery vehicles
  no longer rent out.

## v0.4 (2026-10-15)

- Repair all: a sheet listing every broken vehicle (what broke, cost of each, total), on
  Home and on each vehicle business.
- Broken vehicles show a Repair button right on their card.
- Admin page (`/admin`): add or set cash, reset the account.

## Next ideas

- **More businesses**: real estate; events for sites (inspections, rush hours, fuel price).
- **Staff**: named drivers with skill and salary, a mechanic contract that auto-repairs.
- **Bank loans** to buy the first truck sooner.
- **Fuel price** that moves over time; city zones with different delivery fees.
- **Renters** who return vehicles damaged or late.
- **Offline progress** (needs the backend — see `architecture.md`).
- **Backend**: accounts, server-side simulation, leaderboard.
