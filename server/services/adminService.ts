import bcrypt from "bcryptjs";
import { getClient } from "../db";

export type AdminRole = "superadmin" | "viewer";

export interface AdminUserRecord {
  id: string;
  email: string;
  role: AdminRole;
  passwordHash: string;
}

const mapAdminUser = (row: { id: string; email: string; password_hash: string; role: string }): AdminUserRecord => ({
  id: row.id,
  email: row.email,
  role: (row.role as AdminRole) ?? "viewer",
  passwordHash: row.password_hash
});

export const findAdminByEmail = async (email: string): Promise<AdminUserRecord | null> => {
  const client = await getClient();
  try {
    const { rows } = await client.query<{ id: string; email: string; password_hash: string; role: string }>(
      "SELECT id, email, password_hash, role FROM admin_users WHERE email = $1",
      [email]
    );
    if (!rows.length) {
      return null;
    }
    return mapAdminUser(rows[0]);
  } finally {
    client.release();
  }
};

export const authenticateAdmin = async (email: string, password: string): Promise<AdminUserRecord | null> => {
  const admin = await findAdminByEmail(email);
  if (!admin) {
    return null;
  }
  const isValid = await bcrypt.compare(password, admin.passwordHash);
  return isValid ? admin : null;
};

export interface CreateAdminUserInput {
  email: string;
  password: string;
  role: AdminRole;
}

export interface CreateAdminUserResult {
  id: string;
  email: string;
  role: AdminRole;
}

export const createAdminUser = async (input: CreateAdminUserInput): Promise<CreateAdminUserResult> => {
  const client = await getClient();
  try {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const { rows } = await client.query<{ id: string; email: string; role: string }>(
      `
        INSERT INTO admin_users (id, email, password_hash, role)
        VALUES (gen_random_uuid(), $1, $2, $3)
        RETURNING id, email, role
      `,
      [input.email, passwordHash, input.role]
    );
    const inserted = rows[0];
    return {
      id: inserted.id,
      email: inserted.email,
      role: inserted.role as AdminRole
    };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "23505") {
      throw new Error("An admin with that email already exists");
    }
    throw error;
  } finally {
    client.release();
  }
};
