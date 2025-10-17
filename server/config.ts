import path from "node:path";

const uploadsRoot = process.env.UPLOADS_ROOT
  ? path.resolve(process.env.UPLOADS_ROOT)
  : path.resolve(process.cwd(), "uploads");

export const appConfig = {
  port: Number(process.env.API_PORT ?? 4000),
  uploads: {
    root: uploadsRoot,
    productImages: path.join(uploadsRoot, "products"),
    invoices: path.join(uploadsRoot, "invoices")
  },
  defaultCurrency: process.env.DEFAULT_CURRENCY ?? "INR",
  database: {
    host: process.env.PGHOST ?? "localhost",
    port: Number(process.env.PGPORT ?? 5432),
    name: process.env.PGDATABASE ?? "postgres",
    user: process.env.PGUSER ?? "postgres",
    password: process.env.PGPASSWORD ?? "root",
    schema: process.env.PGSCHEMA ?? "public"
  },
  admin: {
    defaultEmail: process.env.ADMIN_EMAIL ?? "admin@example.com",
    defaultPassword: process.env.ADMIN_PASSWORD ?? "admin123"
  }
};
