import { getClient } from "../db";

export interface CategoryRecord {
  id: string;
  label: string;
  navLabel: string;
  description: string;
  sortOrder: number;
  total: number;
}

export interface CategoryInput {
  id: string;
  label: string;
  navLabel: string;
  description: string;
  sortOrder?: number;
}

export const listCategorySummaries = async (): Promise<CategoryRecord[]> => {
  const client = await getClient();
  try {
    const { rows } = await client.query<CategoryRecord>(
      `
        SELECT
          c.id,
          c.label,
          c.nav_label AS "navLabel",
          c.description,
          c.sort_order AS "sortOrder",
          COUNT(p.id)::integer AS total
        FROM product_categories c
        LEFT JOIN products p ON p.category = c.id
        GROUP BY c.id, c.label, c.nav_label, c.description, c.sort_order
        ORDER BY c.sort_order, c.label
      `
    );
    return rows;
  } finally {
    client.release();
  }
};

export const categoryExists = async (categoryId: string): Promise<boolean> => {
  const client = await getClient();
  try {
    const { rowCount } = await client.query("SELECT 1 FROM product_categories WHERE id = $1", [categoryId]);
    return rowCount > 0;
  } finally {
    client.release();
  }
};

export const createCategory = async (input: CategoryInput): Promise<CategoryRecord> => {
  const client = await getClient();
  try {
    const sortOrder = Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 100;
    const { rows } = await client.query<CategoryRecord>(
      `
        INSERT INTO product_categories (id, label, nav_label, description, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          label,
          nav_label AS "navLabel",
          description,
          sort_order AS "sortOrder",
          0::integer AS total
      `,
      [input.id, input.label, input.navLabel, input.description, sortOrder]
    );
    return rows[0];
  } finally {
    client.release();
  }
};
