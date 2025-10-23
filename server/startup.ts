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
        CREATE TABLE IF NOT EXISTS product_categories (
          id TEXT PRIMARY KEY,
          label TEXT NOT NULL,
          nav_label TEXT NOT NULL,
          description TEXT NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 100,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `
    );

    await client.query(
      `
        ALTER TABLE product_categories
          ADD COLUMN IF NOT EXISTS nav_label TEXT NOT NULL DEFAULT '';
      `
    );

    await client.query(
      `
        ALTER TABLE product_categories
          ALTER COLUMN nav_label DROP DEFAULT;
      `
    );

    await client.query(
      `
        ALTER TABLE product_categories
          ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 100;
      `
    );

    await client.query(
      `
        INSERT INTO product_categories (id, label, nav_label, description, sort_order)
        VALUES
          ('womens', 'Women', 'Women', 'Sculpted silhouettes with adaptive comfort for motion-filled days.', 10),
          ('mens', 'Men', 'Men', 'Tailored classics engineered with modern cushioning stacks.', 20),
          ('kids', 'Kids', 'Kids', 'Play-proof sneakers with intuitive straps and breathable knits.', 30)
        ON CONFLICT (id) DO UPDATE
        SET
          label = EXCLUDED.label,
          nav_label = EXCLUDED.nav_label,
          description = EXCLUDED.description,
          sort_order = EXCLUDED.sort_order,
          updated_at = now()
      `
    );

    await client.query(
      `
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE table_schema = current_schema()
              AND table_name = 'products'
              AND constraint_type = 'CHECK'
              AND constraint_name = 'products_category_check'
          ) THEN
            ALTER TABLE products DROP CONSTRAINT products_category_check;
          END IF;
        END;
        $$;
      `
    );

    await client.query(
      `
        DO $$
        BEGIN
          BEGIN
            ALTER TABLE products
              ADD CONSTRAINT products_category_fkey
              FOREIGN KEY (category)
              REFERENCES product_categories(id)
              ON UPDATE CASCADE
              ON DELETE SET NULL;
          EXCEPTION
            WHEN duplicate_object THEN NULL;
          END;
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

    await client.query(
      `
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'customer_addresses'
              AND column_name = 'postal_code'
          ) THEN
            IF NOT EXISTS (
              SELECT 1
              FROM information_schema.table_constraints tc
              JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name
               AND tc.table_name = ccu.table_name
               AND tc.constraint_schema = ccu.constraint_schema
              WHERE tc.table_schema = current_schema()
                AND tc.table_name = 'customer_addresses'
                AND tc.constraint_type = 'CHECK'
                AND tc.constraint_name = 'customer_addresses_postal_code_check'
            ) THEN
              ALTER TABLE customer_addresses
                ADD CONSTRAINT customer_addresses_postal_code_check
                CHECK (postal_code ~ '^[0-9]{6}$');
            END IF;
          END IF;
        END;
        $$;
      `
    );

    await client.query(
      `
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = current_schema()
              AND table_name = 'inventory_events'
          ) THEN
            BEGIN
              ALTER TABLE inventory_events DROP CONSTRAINT IF EXISTS inventory_events_order_id_fkey;
              ALTER TABLE inventory_events
                ADD CONSTRAINT inventory_events_order_id_fkey
                FOREIGN KEY (order_id)
                REFERENCES orders(id)
                ON DELETE CASCADE
                DEFERRABLE INITIALLY DEFERRED;
            EXCEPTION
              WHEN undefined_table THEN NULL;
              WHEN duplicate_object THEN NULL;
            END;
          END IF;
        END;
        $$;
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
