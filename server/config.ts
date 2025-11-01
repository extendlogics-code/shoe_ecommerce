import path from "node:path";

const uploadsRoot = process.env.UPLOADS_ROOT
  ? path.resolve(process.env.UPLOADS_ROOT)
  : path.resolve(process.cwd(), "uploads");

const resolveAllowedOrigins = () => {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (!raw) {
    return [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:4173",
      "http://127.0.0.1:4173",
      "http://10.0.2.2:5173",
      "capacitor://localhost"
    ];
  }
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const appConfig = {
  port: Number(process.env.API_PORT ?? 4001),
  uploads: {
    root: uploadsRoot,
    productImages: path.join(uploadsRoot, "products"),
    invoices: path.join(uploadsRoot, "invoices")
  },
  defaultCurrency: process.env.DEFAULT_CURRENCY ?? "INR",
  database: {
    connectionString:
      process.env.PG_CONNECTION_STRING ??
      process.env.DATABASE_URL ??
      process.env.SUPABASE_DB_URL ??
      null,
    host: process.env.PGHOST ?? "localhost",
    port: Number(process.env.PGPORT ?? 5432),
    name: process.env.PGDATABASE ?? "postgres",
    user: process.env.PGUSER ?? "postgres",
    password: process.env.PGPASSWORD ?? "root",
    schema: process.env.PGSCHEMA ?? "public",
    sslMode: process.env.PGSSLMODE ?? null,
    sslRejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== "false"
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
  },
  security: {
    corsAllowedOrigins: resolveAllowedOrigins(),
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 100),
    trustProxy: process.env.TRUST_PROXY === "true"
  }
};
