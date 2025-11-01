# Kalaa Shoes – React E-Commerce Experience

Modern, responsive React implementation for a premium footwear storefront inspired by the Kalaa Crafts reference design.

## Features

- React 18 + Vite 5 + TypeScript for a fast, modern developer experience.
- Fully responsive layout with adaptive grids, sticky header, animated hero carousel, and curated product rails.
- Dedicated product listing, detail, cart, and checkout experiences tied together with client-side routing.
- Variant-aware catalogue filters and PDP selectors – shoppers can filter by size/colour, and PDPs enforce the same combinations before adding to cart.
- New Arrivals modal that mirrors admin-managed colourways, including colour-synced “Buy now” CTAs for leather drops.
- Rich storytelling sections (collections, editorial stories, newsletter, brand ticker) aligned with the provided reference.
- Motion primitives powered by Framer Motion and vector icons from Tabler Icons.

## End-to-End Flow Highlights

- **Merchandiser → Storefront** – Product Workbench updates immediately populate storefront grids, the New Arrivals feed, and PDP variant selectors (sizes, colourways, hero angles).
- **Checkout → Inventory** – Order creation adjusts stock levels, writes inventory events, and feeds the admin dashboards without manual reconciliation.
- **Billing Loop** – Invoice generation produces downloadable PDFs, records entries in Postgres, and keeps the order timeline up to date for the operations team.

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

### Use Supabase for Postgres

Supabase exposes a fully managed Postgres instance that works out of the box with this API.

1. Create a Supabase project and copy the **connection string** from Settings → Database.
2. Apply `server/schema.sql` against that database (via the SQL editor or `psql`).
3. Export `PG_CONNECTION_STRING` (or `SUPABASE_DB_URL`) for the Express server. Set `PGSSLMODE=require` and, if needed, `PGSSL_REJECT_UNAUTHORIZED=false`.
4. When building the frontend (web or Android), provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` so the bundle can initialise the Supabase SDK.

The backend automatically detects the connection string and routes all CRUD activity through Supabase while still exposing the same `/api` contract to clients.

#### Local Supabase workspace (Docker)

1. Install and launch Docker Desktop; wait for the whale menu icon to show “Running”.
2. Install the Supabase CLI via Homebrew: `brew install supabase/tap/supabase` and confirm with `supabase --version`.
3. From the project root run `supabase init` (only once) so the CLI creates `supabase/config.toml`.
4. Start the local stack with `supabase start`. The first run downloads Docker images and prints connection details (e.g. `postgresql://postgres:postgres@127.0.0.1:54322/postgres`).
   - Copy the CLI output somewhere safe—it lists `API URL`, `Database URL`, and auth/storage keys for later steps.
5. Export the `Database URL` shown in the CLI output for downstream tools, for example:  
   `export SUPABASE_DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"`.
6. Apply the schema: `psql "$SUPABASE_DB_URL" -f server/schema.sql` (or run `supabase db connect` and execute `\i server/schema.sql`).
7. Update your server `.env` to use the same connection string and restart `npm run server`. Use the CLI’s `Publishable key` as `VITE_SUPABASE_ANON_KEY` and the `API URL` as `VITE_SUPABASE_URL` if the frontend needs direct Supabase access; keep the `Secret key` on the backend only.
8. Visit Supabase Studio at `http://127.0.0.1:54323` (from the CLI output) to inspect tables. Stop the stack anytime with `supabase stop`.

### Run the backend API

```bash
# launches Express on http://localhost:4000
npm run server
```

Override defaults by exporting `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, and `PGSCHEMA`. Optionally set `ADMIN_EMAIL` / `ADMIN_PASSWORD` to seed a custom superadmin login on first boot.

### Run the Vite dev server

```bash
# start the React app on http://localhost:5173 with API proxying
npm run dev
```

Leave both terminals running for a full-stack local experience.

### Configure mobile / production API origin

When you bundle the React app (either for the web or inside the Capacitor Android shell) the `/api` proxy from `vite.config.ts` no longer applies. Point client fetches to your deployed Express API by defining `VITE_API_BASE_URL` before building, for example:

```bash
# .env or .env.production – see .env.example for additional options
VITE_API_BASE_URL=https://api.yourdomain.com
```

The Android build will call `https://api.yourdomain.com/api/...`, letting the server mediate all database access. Keep the database behind the API—mobile clients should never connect directly to MySQL/PostgreSQL. The provided Node service already targets PostgreSQL (an open-source RDBMS well suited for production); update `server/config.ts` env vars if you host it elsewhere.

### Build for production

```bash
npm run build
```

Follow with `npm run preview` if you’d like to inspect the production bundle locally.

### Android (Capacitor) workflow

1. Add a platform-specific env file (example for the emulator):
 ```supabase local development setup is running.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
         MCP URL: http://127.0.0.1:54321/mcp
    Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
     Mailpit URL: http://127.0.0.1:54324
 Publishable key: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
      Secret key: sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
   S3 Access Key: 625729a08b95bf1b7ff351a663f3a23c
   S3 Secret Key: 850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907
       S3 Region: local
```
   ```bash
   cat <<'EOF' > .env.android
   VITE_API_BASE_URL=http://10.0.2.2:4001
   VITE_SUPABASE_URL=http://10.0.2.2:54321
   VITE_SUPABASE_ANON_KEY=<your-publishable-key>
   SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
   PGSSLMODE=disable
   PGSSL_REJECT_UNAUTHORIZED=false
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=admin123
   EOF
   ```
   Replace `10.0.2.2` with your Mac’s LAN IP when testing on a physical device.

2. Build the web bundle with those vars baked in:
   ```bash
   npm run build -- --mode android
   ```

3. Sync the bundle into the native shell and refresh Capacitor:
   ```bash
   npm --prefix android_workspace run sync:web
   npx cap sync android --project-dir android_workspace
   ```

4. Build the APK:
   ```bash
   cd android_workspace/android
   ./gradlew clean assembleDebug       # or assembleRelease once signing is configured
   ```

5. Install for testing:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

`android_workspace/package.json` ships helper scripts (`sync:web`, `open`) if you prefer to work through Android Studio for the final build and signing.

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
- `docs/dependencies.md` – npm modules in use with commands for targeted reinstalls.

## Security

- Hardened CSP and browser security hints are defined in `index.html`—ensure equivalent headers are applied in production.
- Review `SECURITY.md` for OWASP Top 10 coverage, operational checklists, and backend expectations.
- Run `npm run audit` (or `npm audit --production`) in CI to monitor vulnerable dependencies.

Enjoy crafting your bespoke footwear experience!
