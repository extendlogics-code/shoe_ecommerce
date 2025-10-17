# Admin Dashboard & Frontend Architecture

The admin experience lives under the `/admin` path and is implemented entirely in React + TypeScript. The API endpoints it relies on are served from the `server` directory.

## High-Level Flow

1. **Login** (`/admin/login`, `src/pages/AdminLoginPage.tsx`)
   - Superadmins and viewers authenticate via credentials stored in `admin_users`.
   - After three failed attempts a self-service viewer registration form appears.
   - Successful login persists `adminAuthenticated`, `adminEmail`, and `adminRole` in `localStorage`.

2. **Admin Control Lounge** (`/admin`, `src/pages/AdminDashboardPage.tsx`)
   - Landing hub that exposes quick actions to the Orders Dashboard and Product Workbench.
   - Shows the signed-in identity and role badge with a global logout button.

3. **Orders Dashboard** (`/admin/orders`, `src/pages/OrdersDashboardPage.tsx`)
   - Fetches aggregated order data from `GET /api/orders`.
   - Superadmins receive an `Actions` column with:
     - **Edit** – prompts for the next order status and calls `PATCH /api/orders/:id/status`.
     - **Delete** – calls `DELETE /api/orders/:id` and rehydrates the table.
     - **Generate / Download Invoice** – hits `POST /api/orders/:id/invoices` if necessary, then streams the PDF from `GET /api/orders/:id/invoice`.
   - Viewer role is restricted to read-only access; buttons display contextual messaging.

4. **Product Workbench** (`/admin/catalog`, `src/pages/ProductAdminPage.tsx`)
   - Lists products from `GET /api/products` with inventory snapshots.
   - Superadmins can:
     - **Edit** – prefill the uploader form, update details via `PUT /api/products/:id`.
     - **Delete** – remove a product and associated inventory via `DELETE /api/products/:id`.
     - **Mint Viewer Access** – toggled panel wired to `POST /api/admin/users`.
   - Viewers can browse but cannot modify data; the form and controls are disabled.

## Key Backend Routes

| Route | Method | Description |
| --- | --- | --- |
| `/api/admin/login` | POST | Authenticates an admin user. |
| `/api/admin/register` | POST | Self-service viewer registration (after repeated failures). |
| `/api/admin/users` | POST | Superadmin-only endpoint to create viewer credentials. |
| `/api/products` | GET/POST | Fetch catalogue / create product. |
| `/api/products/:id` | PUT/DELETE | Update or delete a product (superadmin only). |
| `/api/orders` | GET/POST | List orders / create order. |
| `/api/orders/:id/status` | PATCH | Update order status with audit event. |
| `/api/orders/:id` | DELETE | Delete an order and its invoice artifact. |
| `/api/orders/:id/invoices` | POST | Generate or refresh an order invoice. |
| `/api/orders/:id/invoice` | GET | Download the latest invoice PDF. |

Backend service implementations live in:
- `server/services/adminService.ts`
- `server/services/productService.ts`
- `server/services/orderService.ts`

Routes are defined in `server/routes/adminAuth.ts`, `server/routes/products.ts`, and `server/routes/orders.ts`.

## State & Role Management

- `localStorage` drives client-side guards and determines which controls render.
- Every mutating request includes the `X-Admin-Role` header which the server validates before executing critical operations.
- Viewer mode surfaces info alerts and disables destructive buttons to prevent accidental modifications.

Use this doc as a primer when onboarding new contributors or planning features around the admin workflows.
