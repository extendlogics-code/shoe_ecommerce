# Project Dependencies

The project is bootstrapped with Vite + React + TypeScript and includes a lightweight Express API. Use the following commands from the project root to install individual packages if you need to rehydrate a selective dependency.

## Runtime Dependencies

| Package | Command | Purpose |
| --- | --- | --- |
| `react` / `react-dom` | `npm install react react-dom` | Core React runtime and DOM renderer. |
| `react-router-dom` | `npm install react-router-dom` | Client-side routing for storefront and admin app. |
| `framer-motion` | `npm install framer-motion` | Motion primitives for hero carousel and section animations. |
| `@tabler/icons-react` | `npm install @tabler/icons-react` | Icon set used across the UI. |
| `clsx` | `npm install clsx` | Conditional className helper for React components. |
| `uuid` | `npm install uuid` | UUID generation (used by API + client helpers). |
| `express` | `npm install express` | HTTP server powering the REST API. |
| `pg` | `npm install pg` | PostgreSQL client for database access. |
| `multer` | `npm install multer` | Multipart handling for product image uploads. |
| `pdfkit` | `npm install pdfkit` | Invoice PDF generation. |
| `bcryptjs` | `npm install bcryptjs` | Password hashing for admin accounts. |

## Development Dependencies

| Package | Command | Purpose |
| --- | --- | --- |
| `typescript` | `npm install --save-dev typescript` | Type checking / declaration support. |
| `@types/*` packages | `npm install --save-dev @types/<package>` | Type definitions for Express, React, PDFKit, Multer, UUID, Bcrypt. |
| `vite` | `npm install --save-dev vite` | Development server and build tool. |
| `@vitejs/plugin-react` | `npm install --save-dev @vitejs/plugin-react` | React fast refresh & TS integration for Vite. |
| `tsx` | `npm install --save-dev tsx` | TypeScript-aware node runner used for `npm run server`. |
| `eslint` + plugins | `npm install --save-dev eslint eslint-plugin-react eslint-config-prettier` | Linting configuration. |
| `prettier` | `npm install --save-dev prettier` | Code formatting. |

> To install everything in one shot, run `npm install` at the project root. The dependency tree above is provided for quick reference or targeted reinstalls.
