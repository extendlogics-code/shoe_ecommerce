# Database Overview

This project uses PostgreSQL as the backing store for catalogue, inventory, ordering, and billing data. The tables are provisioned via `server/schema.sql` and automatically checked during API start-up.

| Table | Purpose |
| --- | --- |
| `customers` | Shopper profile (name, email, phone, marketing opt-in) used across orders. |
| `customer_addresses` | Billing and shipping addresses per customer with soft labels for checkout autofill. |
| `products` | Core catalogue metadata – SKU, pricing, imagery, status, colourways, and size scales. |
| `product_media` | Additional hero or gallery media tied to a product (image/video, alt text, primary flag). |
| `inventory_items` | Current stock position for each SKU, including on-hand, reserved, safety stock, and reorder point. |
| `inventory_events` | Immutable ledger of inventory deltas with optional order linkage for traceability. |
| `orders` | Checkout contract containing totals, status, channel, and customer linkage. |
| `order_items` | Per-line detail for each order including SKU, quantity, pricing, discounts, and tax. |
| `order_events` | Operational timeline of an order (status changes, invoice creation, etc.). |
| `payments` | Payment transaction records (transaction id, amount, currency, status, method). |
| `invoices` | Generated PDF invoices per order, storing file path and snapshot totals. |
| `admin_users` | Admin authentication store with bcrypt-hashed passwords and role (`superadmin` or `viewer`). |

> Tip: run `psql -f server/schema.sql` against a fresh database to bootstrap every table with the correct constraints and triggers. The API’s `ensureDatabaseBootstrap` helper will also ensure array columns and the admin table exist on startup.

## Relationships & Foreign Keys

- `customer_addresses.customer_id` → `customers.id` (cascade on delete).
- `orders.customer_id` → `customers.id`.
- `orders.shipping_address_id` / `orders.billing_address_id` → `customer_addresses.id`.
- `order_items.order_id` → `orders.id` (cascade on delete).
- `order_items.product_id` → `products.id`.
- `order_events.order_id` → `orders.id` (cascade on delete).
- `payments.order_id` → `orders.id` (cascade on delete).
- `invoices.order_id` → `orders.id` (cascade on delete, unique constraint ensures one invoice per order).
- `inventory_items.product_id` → `products.id` (cascade on delete, one-to-one).
- `inventory_events.product_id` → `products.id` (cascade on delete).
- `inventory_events.order_id` → `orders.id` (nullable, tracks the order that triggered an inventory change).
- `product_media.product_id` → `products.id` (cascade on delete).

All relationships enforce referential integrity with `ON DELETE CASCADE` where it makes sense to clean up dependent rows automatically (e.g., removing an order deletes its line items, events, payments, and invoice). Use these pointers when designing joins or extending the schema with reporting tables.

## End-to-End Product Lifecycle

1. **Create** – Admins upload a product from `/admin/catalog`. The API stores media under `uploads/products`, inserts a `products` record (colourways, size scale, merchandising copy), creates a matching `inventory_items` row, and appends an `inventory_events` entry tagged `INITIAL_STOCK`.
2. **Merchandise** – Storefront pages (`/products`, `/products/new`, individual detail views) read directly from `products` and `product_media`, deriving category presentation and surfacing size/colour selections client-side.
3. **Update** – Edits keep the SKU stable, updating `products` columns in place while mutating `inventory_items` and writing adjustment events so history is preserved.
4. **Retire** – Deletions cascade, ensuring residual media, stock snapshots, order links, and events are cleaned up automatically.

## End-to-End Order Lifecycle

1. **Checkout** – The storefront creates an order via `POST /api/orders`, inserting into `orders`, `order_items`, and `payments` while decrementing inventory and logging matched `inventory_events`.
2. **Fulfilment Tracking** – Each status change (`PATCH /api/orders/:id/status`) appends an `order_events` row, keeping the operational timeline auditable.
3. **Billing** – Invoice requests create a PDF artifact, persist it under `uploads/invoices`, and upsert a row in `invoices` tied back to the order.
4. **Reconciliation** – Admin dashboards query joins across `orders`, `order_items`, `payments`, `inventory_items`, and `invoices`, giving a complete customer, stock, and revenue snapshot from a single round trip.

Use these flows as a reference when expanding downstream integrations (e.g., ERP ingestion, analytics pipelines, or third-party fulfilment webhooks).
