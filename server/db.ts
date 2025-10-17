import { Pool } from "pg";
import { appConfig } from "./config";

const pool = new Pool({
  host: appConfig.database.host,
  port: appConfig.database.port,
  user: appConfig.database.user,
  password: appConfig.database.password,
  database: appConfig.database.name,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined
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
