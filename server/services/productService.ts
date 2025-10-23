import { getClient } from "../db";
import { ProductInput } from "../types/products";
import { appConfig } from "../config";

export interface ProductRecord {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  description: string | null;
  productDetails: string[] | null;
  productStory: string | null;
  materialInfo: string | null;
  careInstructions: string[] | null;
  features: string[] | null;
  status: string;
  imagePath: string | null;
  colors: string[];
  sizes: string[];
  category: string | null;
  categoryLabel?: string | null;
  categoryNavLabel?: string | null;
  categoryDescription?: string | null;
  categorySortOrder?: number | null;
  createdAt?: Date;
}

export const createProduct = async (input: ProductInput) => {
  const client = await getClient();
  const currency = input.currency ?? appConfig.defaultCurrency;
  const reserved = input.inventory.reserved ?? 0;
  const safetyStock = input.inventory.safetyStock ?? 0;
  const reorderPoint = input.inventory.reorderPoint ?? Math.max(
    Math.round(input.inventory.onHand * 0.25),
    1
  );

  try {
    await client.query("BEGIN");
    const productResult = await client.query<ProductRecord>(
      `
        INSERT INTO products (
          id,
          sku,
          name,
          description,
          product_details,
          product_story,
          material_info,
          care_instructions,
          features,
          price,
          currency,
          status,
          image_primary_path,
          image_primary_alt,
          colorways,
          size_scale,
          category
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15,
          $16
        )
        RETURNING id, name, sku, price, currency, description, status, image_primary_path AS "imagePath", colorways AS "colors", size_scale AS "sizes", created_at AS "createdAt", product_details AS "productDetails", product_story AS "productStory", material_info AS "materialInfo", care_instructions AS "careInstructions", features, category
      `,
      [
        input.sku,
        input.name,
        input.description ?? null,
        input.productDetails ?? [],
        input.productStory ?? null,
        input.materialInfo ?? null,
        input.careInstructions ?? [],
        input.features ?? [],
        input.price,
        currency,
        input.status ?? "active",
        input.imagePath ?? null,
        input.imageAlt ?? null,
        input.colors,
        input.sizes,
        input.category ?? null
      ]
    );

    const product = productResult.rows[0];

    if (input.imagePath) {
      await client.query(
        `
          INSERT INTO product_media (
            id,
            product_id,
            media_type,
            file_path,
            alt_text,
            is_primary
          )
          VALUES (
            gen_random_uuid(),
            $1,
            'image',
            $2,
            $3,
            TRUE
          )
        `,
        [product.id, input.imagePath, input.imageAlt ?? null]
      );
    }

    await client.query(
      `
        INSERT INTO inventory_items (
          product_id,
          on_hand,
          reserved,
          safety_stock,
          reorder_point
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (product_id)
        DO UPDATE SET
          on_hand = EXCLUDED.on_hand,
          reserved = EXCLUDED.reserved,
          safety_stock = EXCLUDED.safety_stock,
          reorder_point = EXCLUDED.reorder_point,
          updated_at = now()
      `,
      [product.id, input.inventory.onHand, reserved, safetyStock, reorderPoint]
    );

    await client.query(
      `
        INSERT INTO inventory_events (
          id,
          product_id,
          event_type,
          delta,
          source,
          metadata
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2::text,
          $3::integer,
          $4::text,
          jsonb_build_object(
            'sku', $5::text,
            'onHand', $6::integer,
            'reserved', $7::integer
          )
        )
      `,
      [
        product.id,
        input.inventory.onHand === 0 ? "PRODUCT_REGISTERED" : "INITIAL_STOCK",
        input.inventory.onHand,
        "product.create",
        input.sku,
        input.inventory.onHand,
        reserved
      ]
    );

    await client.query("COMMIT");
    return product;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const productSelect = `
        SELECT
          p.id,
          p.name,
          p.sku,
          p.price,
          p.currency,
          p.status,
          p.description,
          p.product_details AS "productDetails",
          p.product_story AS "productStory",
          p.material_info AS "materialInfo",
          p.care_instructions AS "careInstructions",
          p.features,
          p.image_primary_path AS "imagePath",
          COALESCE(p.colorways, '{}'::text[]) AS "colors",
          COALESCE(p.size_scale, '{}'::text[]) AS "sizes",
          p.category,
          c.label AS "categoryLabel",
          c.nav_label AS "categoryNavLabel",
          c.description AS "categoryDescription",
          c.sort_order AS "categorySortOrder",
          p.created_at AS "createdAt",
          i.on_hand AS "onHand",
          i.reserved AS "reserved",
          i.safety_stock AS "safetyStock",
          i.reorder_point AS "reorderPoint"
        FROM products p
        LEFT JOIN product_categories c ON c.id = p.category
        LEFT JOIN inventory_items i ON i.product_id = p.id
`;

export const listProducts = async (category?: string) => {
  const client = await getClient();
  try {
    const values: unknown[] = [];
    let whereClause = "";
    if (category) {
      values.push(category);
      whereClause = `WHERE p.category = $${values.length}`;
    }
    const query = `
      ${productSelect}
      ${whereClause}
      ORDER BY p.created_at DESC
    `;
    const { rows } = await client.query(query, values);
    return rows;
  } finally {
    client.release();
  }
};

export const listRecentProducts = async (limit = 12) => {
  const client = await getClient();
  try {
    const { rows } = await client.query(
      `
        SELECT
          p.id,
          p.name,
          p.sku,
          p.price,
          p.currency,
          p.status,
          p.description,
          p.product_details AS "productDetails",
          p.product_story AS "productStory",
          p.material_info AS "materialInfo",
          p.care_instructions AS "careInstructions",
          p.features,
          p.image_primary_path AS "imagePath",
          COALESCE(p.colorways, '{}'::text[]) AS "colors",
          COALESCE(p.size_scale, '{}'::text[]) AS "sizes",
          p.category,
          c.label AS "categoryLabel",
          c.nav_label AS "categoryNavLabel",
          c.description AS "categoryDescription",
          c.sort_order AS "categorySortOrder",
          p.created_at AS "createdAt",
          i.on_hand AS "onHand",
          i.reserved AS "reserved",
          i.safety_stock AS "safetyStock",
          i.reorder_point AS "reorderPoint"
        FROM products p
        LEFT JOIN product_categories c ON c.id = p.category
        LEFT JOIN inventory_items i ON i.product_id = p.id
        ORDER BY p.created_at DESC
        LIMIT $1
      `,
      [limit]
    );
    return rows;
  } finally {
    client.release();
  }
};

export const deleteProductById = async (productId: string) => {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const result = await client.query("DELETE FROM products WHERE id = $1", [productId]);
    if (result.rowCount === 0) {
      throw new Error("Product not found");
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getProductById = async (productId: string) => {
  const client = await getClient();
  try {
    const { rows } = await client.query(
      `
        ${productSelect}
        WHERE p.id = $1
      `,
      [productId]
    );
    return rows[0] ?? null;
  } finally {
    client.release();
  }
};

export const updateProduct = async (productId: string, input: ProductInput) => {
  const client = await getClient();
  const currency = input.currency ?? appConfig.defaultCurrency;
  const reserved = input.inventory.reserved ?? 0;
  const safetyStock = input.inventory.safetyStock ?? 0;
  const reorderPoint = input.inventory.reorderPoint ?? Math.max(
    Math.round(input.inventory.onHand * 0.25),
    1
  );

  try {
    await client.query("BEGIN");

    const updateResult = await client.query<ProductRecord>(
      `
        UPDATE products
        SET
          sku = $2,
          name = $3,
          description = $4,
          product_details = $5,
          product_story = $6,
          material_info = $7,
          care_instructions = $8,
          features = $9,
          price = $10,
          currency = $11,
          status = $12,
          image_primary_path = COALESCE($13, image_primary_path),
          image_primary_alt = COALESCE($14, image_primary_alt),
          colorways = $15,
          size_scale = $16,
          category = $17,
          updated_at = now()
        WHERE id = $1
        RETURNING id, name, sku, price, currency, description, status, image_primary_path AS "imagePath", colorways AS "colors", size_scale AS "sizes", created_at AS "createdAt", product_details AS "productDetails", product_story AS "productStory", material_info AS "materialInfo", care_instructions AS "careInstructions", features, category
      `,
      [
        productId,
        input.sku,
        input.name,
        input.description ?? null,
        input.productDetails ?? [],
        input.productStory ?? null,
        input.materialInfo ?? null,
        input.careInstructions ?? [],
        input.features ?? [],
        input.price,
        currency,
        input.status ?? "active",
        input.imagePath ?? null,
        input.imageAlt ?? null,
        input.colors,
        input.sizes,
        input.category ?? null
      ]
    );

    if (updateResult.rowCount === 0) {
      throw new Error("Product not found");
    }

    await client.query(
      `
        INSERT INTO inventory_items (
          product_id,
          on_hand,
          reserved,
          safety_stock,
          reorder_point
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (product_id)
        DO UPDATE SET
          on_hand = EXCLUDED.on_hand,
          reserved = EXCLUDED.reserved,
          safety_stock = EXCLUDED.safety_stock,
          reorder_point = EXCLUDED.reorder_point,
          updated_at = now()
      `,
      [productId, input.inventory.onHand, reserved, safetyStock, reorderPoint]
    );

    await client.query("COMMIT");
    return updateResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
