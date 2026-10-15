# Road to Rich — demo

A business-management game. You start with **$50,000** and grow a group of businesses,
each with its own licence price: a **Delivery Company** (free), **Car Rental**, a
**Restaurant Chain** and **Gas Stations**. Vehicles are real makes and models; they wear
out, **break down at random** and earn nothing until you repair them, and hit the
**1,000,000 km** limit, where they need an overhaul or go to the scrapyard. Restaurants
and stations open at random addresses and earn more with every level you buy.

**Frontend only for now.** All data is static (in `src/app/core/data/`), the game runs in
the browser, and progress is saved in `localStorage`. A backend comes later — see
[`docs/architecture.md`](docs/architecture.md).

| Doc | What it holds |
|---|---|
| [`docs/game-design.md`](docs/game-design.md) | The rules and every number: prices, incomes, breakdowns, wear, time. |
| [`docs/architecture.md`](docs/architecture.md) | Folders, how state flows, and the plan for the backend. |
| [`docs/roadmap.md`](docs/roadmap.md) | What is built, what comes next. |
| [`CLAUDE.md`](CLAUDE.md) | Conventions for working on the code. |

## Stack

Angular 19 (standalone components, signals, new control flow) · Tailwind CSS 3 ·
Lucide icons · no backend.

## Run it

```bash
npm install
npm start            # ng serve → http://localhost:4300 (4200 is RichLife)
npm run build        # → dist/road-to-rich/browser
```

On this machine the system Node is 18.18, too old for the Angular 19 CLI. Run the CLI
on a throwaway Node 20 instead (see `CLAUDE.md`):

```bash
export PATH="/c/Program Files/nodejs:$PATH"
npx -y -p node@20 node node_modules/@angular/cli/bin/ng.js serve --port 4300
```

## Deploy (Netlify)

`netlify.toml` builds the app and publishes `dist/road-to-rich/browser`, with the SPA
fallback to `index.html`. Make it **its own Netlify site** from **its own GitHub repo**,
separate from RichLife, so a push to one never rebuilds the other.
