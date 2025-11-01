import { Pool, types } from "pg";
import { appConfig } from "./config";

const parseNumeric = (value: string | null) => (value === null ? null : Number(value));

types.setTypeParser(1700, parseNumeric);

const resolveSslConfig = () => {
  const { sslMode, sslRejectUnauthorized, connectionString } = appConfig.database;
  const normalizedMode = sslMode?.toLowerCase();
  const disableModes = new Set(["disable", "allow", "prefer"]);
  const requireModes = new Set(["require", "verify-ca", "verify-full"]);

  // Explicit env override
  if (normalizedMode) {
    if (disableModes.has(normalizedMode)) {
      return undefined;
    }
    if (requireModes.has(normalizedMode)) {
      return { rejectUnauthorized: sslRejectUnauthorized };
    }
  }

  if (!connectionString) {
    return undefined;
  }

  try {
    const url = new URL(connectionString);
    const host = url.hostname.toLowerCase();
    const sslParam = url.searchParams.get("sslmode")?.toLowerCase();

    if (sslParam) {
      if (disableModes.has(sslParam)) {
        return undefined;
      }
      if (requireModes.has(sslParam)) {
        return { rejectUnauthorized: sslRejectUnauthorized };
      }
    }

    const normalizedHost = host.replace(/^\[|\]$/g, ""); // strip IPv6 brackets
    const isLoopback =
      normalizedHost === "localhost" ||
      normalizedHost === "127.0.0.1" ||
      normalizedHost === "::1";
    const isPrivateNetwork =
      /^10\./.test(normalizedHost) ||
      /^192\.168\./.test(normalizedHost) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(normalizedHost);
    const isInternalDomain = normalizedHost.endsWith(".internal");

    if (isLoopback || isPrivateNetwork || isInternalDomain) {
      return undefined;
    }

    // Default to requiring SSL for remote hosts (e.g. hosted Supabase)
    return { rejectUnauthorized: sslRejectUnauthorized };
  } catch {
    // If parsing fails, fall back to previous behaviour of preferring SSL
    return { rejectUnauthorized: sslRejectUnauthorized };
  }
};

const pool = new Pool({
  connectionString: appConfig.database.connectionString ?? undefined,
  host: appConfig.database.connectionString ? undefined : appConfig.database.host,
  port: appConfig.database.connectionString ? undefined : appConfig.database.port,
  user: appConfig.database.connectionString ? undefined : appConfig.database.user,
  password: appConfig.database.connectionString ? undefined : appConfig.database.password,
  database: appConfig.database.connectionString ? undefined : appConfig.database.name,
  ssl: resolveSslConfig()
});

export const getClient = async () => {
  const client = await pool.connect();
  const schema = appConfig.database.schema;
  if (schema) {
    if (!/^\w+$/.test(schema)) {
      client.release();
      throw new Error("Invalid schema name configured. Only alphanumeric and underscore characters are allowed.");
    }
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
  }
  return client;
};

export const verifyConnection = async () => {
  const client = await getClient();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
};

export default pool;
