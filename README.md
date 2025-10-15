# Kalaa Shoes – React E-Commerce Experience

Modern, responsive React implementation for a premium footwear storefront inspired by the Kalaa Crafts reference design.

## Features

- React 18 + Vite 5 + TypeScript for a fast, modern developer experience.
- Fully responsive layout with adaptive grids, sticky header, animated hero carousel, and curated product rails.
- Dedicated product listing, detail, cart, and checkout experiences tied together with client-side routing.
- Rich storytelling sections (collections, editorial stories, newsletter, brand ticker) aligned with the provided reference.
- Motion primitives powered by Framer Motion and vector icons from Tabler Icons.

## Getting Started

```bash
# install dependencies
npm install

# start local dev server
npm run dev

# build for production
npm run build
```

> **Note:** Vite opens on http://localhost:5173 by default.

## Project Structure

- `src/App.tsx` – routing shell that wires all top-level pages together.
- `src/pages/` – routed experiences for home, catalog, product detail, cart, and checkout flows.
- `src/components/` – modular UI sections (header, hero, product rails, etc.).
- `src/data/` – structured content for navigation, collections, and editorial stories.
- `src/styles/global.css` – global theme tokens and component styles.
- `src/context/CartContext.tsx` – cart state management shared across pages.

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

## Security

- Hardened CSP and browser security hints are defined in `index.html`—ensure equivalent headers are applied in production.
- Review `SECURITY.md` for OWASP Top 10 coverage, operational checklists, and backend expectations.
- Run `npm run audit` (or `npm audit --production`) in CI to monitor vulnerable dependencies.

Enjoy crafting your bespoke footwear experience!
