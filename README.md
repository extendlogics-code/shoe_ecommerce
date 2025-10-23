# Kalaa Shoes – React E-Commerce Experience

Modern, responsive React implementation for a premium footwear storefront inspired by the Kalaa Crafts reference design.

## Features

- React 18 + Vite 5 + TypeScript for a fast, modern developer experience.
- Fully responsive layout with adaptive grids, sticky header, animated hero carousel, and curated product rails.
- Dedicated product listing, detail, cart, and checkout experiences tied together with client-side routing.
- Rich storytelling sections (collections, editorial stories, newsletter, brand ticker) aligned with the provided reference.
- Motion primitives powered by Framer Motion and vector icons from Tabler Icons.

## Getting Started

### Prerequisites

- Node.js 18+ (project validated with Node 18/20/22).
- PostgreSQL instance reachable with the credentials in `server/config.ts` (defaults to `postgres:root@localhost:5432` inside schema `public`).
- Optional: VS Code with ESLint and Prettier extensions for inline feedback.

### Install dependencies

```bash
npm install
```

### Prepare the database

```bash
# seed tables, constraints, and triggers
psql -U postgres -h localhost postgres -f server/schema.sql
```

The API also runs `ensureDatabaseBootstrap`, but executing the script once ensures connectivity and permissions are correct before you start coding.

### Run the backend API

```bash
# launches Express on http://localhost:4001
npm run server
```

Override defaults by exporting `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, and `PGSCHEMA`. Optionally set `ADMIN_EMAIL` / `ADMIN_PASSWORD` to seed a custom superadmin login on first boot.

### Run the Vite dev server

```bash
# start the React app on http://localhost:5173 with API proxying
npm run dev
```

Leave both terminals running for a full-stack local experience.

### Build for production

```bash
npm run build
```

Follow with `npm run preview` if you’d like to inspect the production bundle locally.

## Git Workflow

```bash
# initialize tracking if this is a fresh checkout
git init

# stage and commit local changes
git add .
git commit -m "Your commit message"

# point to the hosted repository (skip if already set)
git remote add origin https://github.com/extendlogics-code/shoe_ecommerce.git

# push your branch (replace master with your branch name if different)
git push -u origin master
```

## Project Structure

- `src/App.tsx` – routing shell that wires all top-level pages together.
- `src/pages/` – routed experiences for home, catalog, product detail, cart, checkout, and admin dashboards.
- `src/pages/Admin*` – login, control lounge, orders dashboard, and product workbench implementations.
- `src/components/` – modular UI sections (header, hero, product rails, etc.).
- `src/data/` – structured content for navigation, collections, and editorial stories.
- `src/styles/global.css` – global theme tokens and component styles.
- `src/context/CartContext.tsx` – cart state management shared across pages.
- `server/` – Express API (database pool, routes, services, startup helpers).

## Customization

- Update imagery or copy by adjusting data objects inside `src/data/*`.
- Replace accent colors or typography via CSS variables in `src/styles/global.css`.
- Plug in real product APIs by swapping the mock arrays with live fetches or a commerce SDK.

## Accessibility & Responsiveness

- Semantic HTML landmarks, keyboard-friendly controls, and accessible alt text.
- Breakpoints tuned for large desktop down to small mobile.
- Components stick to modern CSS features (flexbox, grid, clamp) for smooth scaling.

## Tooling

- ESLint (flat config) + Prettier for linting/formatting.
- Scripts baked into `package.json` for dev, build, preview, lint, and format.

## Documentation

- `docs/database.md` – canonical schema definition and bootstrap instructions.
- `docs/database-overview.md` – quick reference for every table and its intent.
- `docs/admin-dashboard.md` – walkthrough of admin login, dashboards, and supporting API endpoints.

## Security

- Hardened CSP and browser security hints are defined in `index.html`—ensure equivalent headers are applied in production.
- Review `SECURITY.md` for OWASP Top 10 coverage, operational checklists, and backend expectations.
- Run `npm run audit` (or `npm audit --production`) in CI to monitor vulnerable dependencies.

Enjoy crafting your bespoke footwear experience!
