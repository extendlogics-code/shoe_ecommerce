import bcrypt from "bcryptjs";
import { getClient } from "./db";
import { appConfig } from "./config";

export const ensureDatabaseBootstrap = async () => {
  const client = await getClient();
  try {
    await client.query(
      `
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_name = 'products' AND table_schema = current_schema()
          ) THEN
            IF NOT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_name = 'products' AND column_name = 'colorways' AND table_schema = current_schema()
            ) THEN
              ALTER TABLE products
                ADD COLUMN colorways TEXT[] NOT NULL DEFAULT '{}'::text[];
            END IF;

            IF NOT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_name = 'products' AND column_name = 'size_scale' AND table_schema = current_schema()
            ) THEN
              ALTER TABLE products
                ADD COLUMN size_scale TEXT[] NOT NULL DEFAULT '{}'::text[];
            END IF;
          END IF;
        END;
        $$;
      `
    );

    await client.query(
      `
        CREATE TABLE IF NOT EXISTS admin_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('superadmin', 'viewer')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `
    );

    await client.query(
      `
        ALTER TABLE admin_users
          ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'viewer';
      `
    );

    await client.query(
      `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE table_schema = current_schema()
              AND table_name = 'admin_users'
              AND constraint_name = 'admin_users_role_check'
          ) THEN
            ALTER TABLE admin_users
              ADD CONSTRAINT admin_users_role_check CHECK (role IN ('superadmin', 'viewer'));
          END IF;
        END;
        $$;
      `
    );

    await client.query("UPDATE admin_users SET role = COALESCE(role, 'viewer')");

    await client.query(
      `
        DROP TRIGGER IF EXISTS set_admin_users_updated_at ON admin_users;
        CREATE TRIGGER set_admin_users_updated_at
        BEFORE UPDATE ON admin_users
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();
      `
    );

    const defaultEmail = appConfig.admin.defaultEmail;
    const defaultPassword = appConfig.admin.defaultPassword;

    if (defaultEmail && defaultPassword) {
      const { rows } = await client.query<{ id: string }>("SELECT id FROM admin_users WHERE email = $1", [defaultEmail]);
      if (rows.length === 0) {
        const passwordHash = await bcrypt.hash(defaultPassword, 12);
        await client.query(
          `
            INSERT INTO admin_users (id, email, password_hash, role)
            VALUES (gen_random_uuid(), $1, $2, 'superadmin')
            ON CONFLICT (email) DO NOTHING
          `,
          [defaultEmail, passwordHash]
        );
      } else {
        await client.query(
          `
            UPDATE admin_users
            SET role = 'superadmin'
            WHERE email = $1
          `,
          [defaultEmail]
        );
      }
    }
  } finally {
    client.release();
  }
};
