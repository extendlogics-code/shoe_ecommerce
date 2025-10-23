# Data Platform Blueprint

This project now ships with a PostgreSQL-first operational data model that captures catalog, inventory, customer, order, and billing signals required for the admin dashboard.

## Logical Domains

| Domain | Tables | Purpose |
| --- | --- | --- |
| Identity | `customers`, `customer_addresses` | Own the shopper profile and historical address book (billing vs shipping). |
| Catalog | `products`, `product_media` | Store SKU metadata, colorways, size scale, hero imagery, and merchandising content. |
| Inventory | `inventory_items`, `inventory_events` | Maintain real-time stock positions and track every mutation with contextual events (SKU, order linkage, deltas). |
| Orders | `orders`, `order_items`, `order_events` | Represent the checkout contract, its line items, and the operational timeline (status transitions, invoice generation, fulfilment events). |
| Revenue | `payments`, `invoices` | Capture transaction authorisation/capture details and persist generated invoice artifacts for auditing. |

## DDL

All tables—including constraints, triggers, and relationships—are codified in [`server/schema.sql`](../server/schema.sql). Apply the script to bootstrap a clean database:

```bash
psql -U root -h localhost postgres -f server/schema.sql
```

The schema enables:

- UUID keys (via `pgcrypto`) to keep identifiers opaque
- Unique SKUs and transaction IDs
- Deferrable FK from inventory events to orders so you can ingest inventory adjustments before an order record exists (useful for async pipelines)
- Update triggers to maintain `updated_at` columns automatically
- Array-backed `colorways` and `size_scale` columns on `products` to support multi-variant merchandising straight from the admin uploader

## Storage Directories

The API writes assets to the project-level `uploads/` hierarchy:

- `uploads/products/` — original product imagery from the admin uploader
- `uploads/invoices/` — PDF invoices generated on demand via the dashboard

The relative file paths are persisted in Postgres so the frontend can download them directly.

## Event + Inventory Alignment

Every time an order line allocates stock the service:

1. Decrements `inventory_items.on_hand`
2. Increments `inventory_items.reserved`
3. Appends an `inventory_events` record with the SKU, quantity delta, order ID, and order item reference
4. Emits an `order_events` `ORDER_CREATED` timeline entry

This keeps the Orders dashboard and Inventory view in sync without denormalising state.

## PDF Invoice Workflow

```
POST /api/orders/:orderId/invoices
    ↓
Fetch order graph (customer, addresses, items, payment)
    ↓
Render A4 PDF via PDFKit → uploads/invoices/INV-*.pdf
    ↓
Upsert row in invoices table & capture order event
```

The same flow is available by transaction ID (`/api/orders/transaction/:transactionId/invoices`). Download endpoints stream the stored PDF back to the browser.

## REST Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/orders` | Dashboard dataset with customers, items, inventory snapshots, payments, and invoices. |
| `POST` | `/api/orders` | Creates an order, captures payment metadata, updates inventory, and appends timeline events. |
| `POST` | `/api/orders/:orderId/invoices` | Generates or refreshes a PDF invoice for a given order. |
| `POST` | `/api/orders/transaction/:transactionId/invoices` | Invoice generation keyed off payment transaction ID. |
| `GET` | `/api/orders/:orderId/invoice` | Streams the latest invoice PDF for download. |
| `GET` | `/api/orders/transaction/:transactionId` | Fetch a single order payload by payment transaction. |
| `GET` | `/api/products` | Catalog + inventory snapshot for the Product Workbench page. |
| `GET` | `/api/products/new` | “New Arrivals” dataset used by the storefront teaser modal. |
| `GET` | `/api/products/:id` | Full product graph for PDP hydration (colourways, size scale, angles). |
| `POST` | `/api/products` | Handles multipart upload, stores imagery, and initialises inventory with an event trail. |
| `POST` | `/api/products/:productId/media` | Adds gallery media to an existing product. |
| `PUT` | `/api/products/:id` | Updates merchandising copy, pricing, or stock positions. |
| `DELETE` | `/api/products/:id` | Removes a product and associated inventory + media. |

## Product Intake Flow

1. **Upload** – `POST /api/products` ingests the admin form payload, saves source imagery, and seeds `products`, `product_media`, and `inventory_items`.
2. **Snapshot** – The Product Workbench re-hydrates via `GET /api/products`, which returns derived stock counts, variant availability, and presentation metadata.
3. **Promotion** – Storefront listings (category grid, new arrivals, PDP) consume `/api/products`, `/api/products/new`, and `/api/products/:id`, presenting variant selectors (sizes, colourways) and badge copy straight from the database.

## Order → Inventory Flow

1. **Checkout** – `POST /api/orders` records `orders`, `order_items`, and `payments` in a single transaction, while `inventory_items` quantities are adjusted and `inventory_events` are written with contextual deltas.
2. **Status Changes** – `PATCH /api/orders/:id/status` writes `order_events` timelines that the admin dashboard surfaces to operators.
3. **Fulfilment / Cancellation** – Downstream operations call update endpoints that either decrement reserved stock (fulfilment) or restock inventory with matching `inventory_events` tagged `RESTOCK`, keeping the ledger balanced for analytics.

## Next Steps

- Wire authentication/authorisation before exposing admin routes publicly.
- Add fulfilment and shipment tables if you need carrier tracking.
- Push invoice metadata into an object store (S3, GCS) for horizontal scaling.
- Schedule nightly inventory snapshots to support trend reporting.
