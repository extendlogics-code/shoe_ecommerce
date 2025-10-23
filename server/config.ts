import path from "node:path";

const uploadsRoot = process.env.UPLOADS_ROOT
  ? path.resolve(process.env.UPLOADS_ROOT)
  : path.resolve(process.cwd(), "uploads");

export const appConfig = {
  port: Number(process.env.API_PORT ?? 4001),
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
  },
  mail: {
    host: process.env.SMTP_HOST || null,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || null,
    pass: process.env.SMTP_PASS || null,
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@kalaa.example",
    enabled: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  }
};
