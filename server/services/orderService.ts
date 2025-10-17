import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import PDFDocument from "pdfkit";
import { getClient } from "../db";
import { appConfig } from "../config";
import { OrderCreateInput, OrderItemInput } from "../types/orders";

type JsonRecord = Record<string, unknown>;

interface OrderRow {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  currency: string;
  transaction_id: string;
  channel: string | null;
  note: string | null;
  placed_at: Date;
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  shipping_address_id: string | null;
  shipping_label: string | null;
  shipping_line1: string | null;
  shipping_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  billing_address_id: string | null;
  billing_label: string | null;
  billing_line1: string | null;
  billing_line2: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_postal_code: string | null;
  billing_country: string | null;
}

interface ItemRow {
  id: string;
  order_id: string;
  product_id: string;
  sku: string;
  quantity: number;
  unit_price: number;
  discount_amount: number | null;
  tax_amount: number | null;
  product_name: string;
  image_path: string | null;
  inventory_on_hand: number | null;
  inventory_reserved: number | null;
}

interface EventRow {
  id: string;
  order_id: string;
  event_type: string;
  actor: string | null;
  note: string | null;
  metadata: JsonRecord | null;
  created_at: Date;
}

interface InvoiceRow {
  id: string;
  order_id: string;
  invoice_number: string;
  pdf_path: string;
  generated_at: Date;
  total_amount: number;
  currency: string;
}

interface PaymentRow {
  id: string;
  order_id: string;
  transaction_id: string;
  status: string;
  amount: number;
  currency: string;
  method: string | null;
  processed_at: Date;
}

export interface OrderDashboardEntry {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  transactionId: string;
  channel: string | null;
  note: string | null;
  placedAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  shippingAddress?: AddressSnapshot;
  billingAddress?: AddressSnapshot;
  items: OrderItemSnapshot[];
  events: OrderEventSnapshot[];
  payment?: PaymentSnapshot;
  invoice?: InvoiceSnapshot;
}

export interface AddressSnapshot {
  id: string;
  label: string | null;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface OrderItemSnapshot {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number | null;
  tax: number | null;
  imagePath: string | null;
  inventory: {
    onHand: number | null;
    reserved: number | null;
  };
}

export interface OrderEventSnapshot {
  id: string;
  type: string;
  actor: string | null;
  note: string | null;
  metadata: JsonRecord | null;
  createdAt: string;
}

export interface InvoiceSnapshot {
  id: string;
  invoiceNumber: string;
  pdfPath: string;
  generatedAt: string;
  totalAmount: number;
  currency: string;
}

export interface PaymentSnapshot {
  id: string;
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  method: string | null;
  processedAt: string;
}

const ALLOWED_ORDER_STATUSES = new Set([
  "processing",
  "paid",
  "fulfilled",
  "cancelled",
  "refunded"
]);

const buildOrderAggregates = (
  orders: OrderRow[],
  items: ItemRow[],
  events: EventRow[],
  invoices: InvoiceRow[],
  payments: PaymentRow[]
): OrderDashboardEntry[] => {
  const orderMap = new Map<string, OrderDashboardEntry>();

  orders.forEach((row) => {
    orderMap.set(row.id, {
      id: row.id,
      orderNumber: row.order_number,
      status: row.status,
      totalAmount: row.total_amount,
      currency: row.currency,
      transactionId: row.transaction_id,
      channel: row.channel,
      note: row.note,
      placedAt: row.placed_at.toISOString(),
      customer: {
        id: row.customer_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone
      },
      shippingAddress: row.shipping_address_id
        ? {
            id: row.shipping_address_id,
            label: row.shipping_label,
            line1: row.shipping_line1,
            line2: row.shipping_line2,
            city: row.shipping_city,
            state: row.shipping_state,
            postalCode: row.shipping_postal_code,
            country: row.shipping_country
          }
        : undefined,
      billingAddress: row.billing_address_id
        ? {
            id: row.billing_address_id,
            label: row.billing_label,
            line1: row.billing_line1,
            line2: row.billing_line2,
            city: row.billing_city,
            state: row.billing_state,
            postalCode: row.billing_postal_code,
            country: row.billing_country
          }
        : undefined,
      items: [],
      events: []
    });
  });

  items.forEach((item) => {
    const order = orderMap.get(item.order_id);
    if (order) {
      order.items.push({
        id: item.id,
        productId: item.product_id,
        sku: item.sku,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        discount: item.discount_amount,
        tax: item.tax_amount,
        imagePath: item.image_path,
        inventory: {
          onHand: item.inventory_on_hand,
          reserved: item.inventory_reserved
        }
      });
    }
  });

  events.forEach((event) => {
    const order = orderMap.get(event.order_id);
    if (order) {
      order.events.push({
        id: event.id,
        type: event.event_type,
        actor: event.actor,
        note: event.note,
        metadata: event.metadata,
        createdAt: event.created_at.toISOString()
      });
    }
  });

  invoices.forEach((invoice) => {
    const order = orderMap.get(invoice.order_id);
    if (order) {
      order.invoice = {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        pdfPath: invoice.pdf_path,
        generatedAt: invoice.generated_at.toISOString(),
        totalAmount: invoice.total_amount,
        currency: invoice.currency
      };
    }
  });

  payments.forEach((payment) => {
    const order = orderMap.get(payment.order_id);
    if (order) {
      order.payment = {
        id: payment.id,
        transactionId: payment.transaction_id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        processedAt: payment.processed_at.toISOString()
      };
    }
  });

  return Array.from(orderMap.values());
};

const loadOrderSlices = async (filter: { clause: string; values: unknown[] }) => {
  const client = await getClient();

  try {
    const ordersResult = await client.query<OrderRow>(
      `
        SELECT
          o.id,
          o.order_number,
          o.status,
          o.total_amount,
          o.currency,
          o.transaction_id,
          o.channel,
          o.note,
          o.placed_at,
          c.id AS customer_id,
          c.first_name,
          c.last_name,
          c.email,
          c.phone,
          ship.id AS shipping_address_id,
          ship.label AS shipping_label,
          ship.line1 AS shipping_line1,
          ship.line2 AS shipping_line2,
          ship.city AS shipping_city,
          ship.state AS shipping_state,
          ship.postal_code AS shipping_postal_code,
          ship.country AS shipping_country,
          bill.id AS billing_address_id,
          bill.label AS billing_label,
          bill.line1 AS billing_line1,
          bill.line2 AS billing_line2,
          bill.city AS billing_city,
          bill.state AS billing_state,
          bill.postal_code AS billing_postal_code,
          bill.country AS billing_country
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        LEFT JOIN customer_addresses ship ON ship.id = o.shipping_address_id
        LEFT JOIN customer_addresses bill ON bill.id = o.billing_address_id
        WHERE ${filter.clause}
        ORDER BY o.placed_at DESC
      `,
      filter.values
    );

    const orderRows = ordersResult.rows;

    if (!orderRows.length) {
      return [];
    }

    const orderIds = orderRows.map((row) => row.id);

    const itemsResult = await client.query<ItemRow>(
      `
        SELECT
          oi.id,
          oi.order_id,
          oi.product_id,
          oi.sku,
          oi.quantity,
          oi.unit_price,
          oi.discount_amount,
          oi.tax_amount,
          p.name AS product_name,
          p.image_primary_path AS image_path,
          inv.on_hand AS inventory_on_hand,
          inv.reserved AS inventory_reserved
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        LEFT JOIN inventory_items inv ON inv.product_id = p.id
        WHERE oi.order_id = ANY($1::uuid[])
      `,
      [orderIds]
    );

    const eventsResult = await client.query<EventRow>(
      `
        SELECT
          id,
          order_id,
          event_type,
          actor,
          note,
          metadata,
          created_at
        FROM order_events
        WHERE order_id = ANY($1::uuid[])
        ORDER BY created_at ASC
      `,
      [orderIds]
    );

    const invoicesResult = await client.query<InvoiceRow>(
      `
        SELECT
          id,
          order_id,
          invoice_number,
          pdf_path,
          generated_at,
          total_amount,
          currency
        FROM invoices
        WHERE order_id = ANY($1::uuid[])
      `,
      [orderIds]
    );

    const paymentsResult = await client.query<PaymentRow>(
      `
        SELECT
          id,
          order_id,
          transaction_id,
          status,
          amount,
          currency,
          method,
          processed_at
        FROM payments
        WHERE order_id = ANY($1::uuid[])
      `,
      [orderIds]
    );

    return buildOrderAggregates(
      orderRows,
      itemsResult.rows,
      eventsResult.rows,
      invoicesResult.rows,
      paymentsResult.rows
    );
  } finally {
    client.release();
  }
};

const upsertCustomer = async (
  client: Awaited<ReturnType<typeof getClient>>,
  input: OrderCreateInput["customer"]
) => {
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO customers (
        id,
        first_name,
        last_name,
        email,
        phone
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4
      )
      ON CONFLICT (email)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = COALESCE(EXCLUDED.phone, customers.phone),
        updated_at = now()
      RETURNING id
    `,
    [input.firstName, input.lastName, input.email, input.phone ?? null]
  );

  return result.rows[0].id;
};

const insertAddress = async (
  client: Awaited<ReturnType<typeof getClient>>,
  customerId: string,
  role: "billing" | "shipping",
  address: OrderCreateInput["shippingAddress"]
) => {
  const result = await client.query<{ id: string }>(
    `
      INSERT INTO customer_addresses (
        id,
        customer_id,
        label,
        line1,
        line2,
        city,
        state,
        postal_code,
        country,
        address_type
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
        $9
      )
      RETURNING id
    `,
    [
      customerId,
      address.label ?? `${role.toUpperCase()} ADDRESS`,
      address.line1,
      address.line2 ?? null,
      address.city,
      address.state ?? null,
      address.postalCode,
      address.country,
      role
    ]
  );

  return result.rows[0].id;
};

const updateInventoryForItem = async (
  client: Awaited<ReturnType<typeof getClient>>,
  orderId: string,
  orderItemId: string,
  item: OrderItemInput
) => {
  const inventoryResult = await client.query<{ on_hand: number; reserved: number }>(
    `
      UPDATE inventory_items
      SET
        on_hand = on_hand - $2,
        reserved = reserved + $2,
        updated_at = now()
      WHERE product_id = $1
      RETURNING on_hand, reserved
    `,
    [item.productId, item.quantity]
  );

  if (!inventoryResult.rowCount) {
    throw new Error(`Inventory record missing for product ${item.productId}`);
  }

  await client.query(
    `
      INSERT INTO inventory_events (
        id,
        product_id,
        order_id,
        event_type,
        delta,
        source,
        metadata
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        'ORDER_ALLOCATED',
        $3,
        'order.create',
        jsonb_build_object(
          'orderItemId', $4,
          'sku', $5,
          'quantity', $6
        )
      )
    `,
    [
      item.productId,
      orderId,
      -Math.abs(item.quantity),
      orderItemId,
      item.sku,
      item.quantity
    ]
  );
};

const insertOrderItem = async (
  client: Awaited<ReturnType<typeof getClient>>,
  orderId: string,
  item: OrderItemInput
) => {
  const itemResult = await client.query<{ id: string }>(
    `
      INSERT INTO order_items (
        id,
        order_id,
        product_id,
        sku,
        quantity,
        unit_price,
        discount_amount,
        tax_amount
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7
      )
      RETURNING id
    `,
    [
      orderId,
      item.productId,
      item.sku,
      item.quantity,
      item.unitPrice,
      item.discount ?? 0,
      item.tax ?? 0
    ]
  );

  const orderItemId = itemResult.rows[0].id;
  await updateInventoryForItem(client, orderId, orderItemId, item);

  return orderItemId;
};

const createOrderEvent = async (
  client: Awaited<ReturnType<typeof getClient>>,
  orderId: string,
  type: string,
  note: string | null,
  metadata: JsonRecord
) => {
  await client.query(
    `
      INSERT INTO order_events (
        id,
        order_id,
        event_type,
        actor,
        note,
        metadata
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        'system',
        $3,
        $4
      )
    `,
    [orderId, type, note, metadata]
  );
};

const insertPayment = async (
  client: Awaited<ReturnType<typeof getClient>>,
  orderId: string,
  transactionId: string,
  amount: number,
  currency: string
) => {
  await client.query(
    `
      INSERT INTO payments (
        id,
        order_id,
        transaction_id,
        status,
        amount,
        currency,
        method,
        processed_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        'captured',
        $3,
        $4,
        'card',
        now()
      )
      ON CONFLICT (transaction_id) DO NOTHING
    `,
    [orderId, transactionId, amount, currency]
  );
};

export const listOrders = async () => {
  return loadOrderSlices({ clause: "TRUE", values: [] });
};

export const findOrderById = async (orderId: string) => {
  const results = await loadOrderSlices({ clause: "o.id = $1", values: [orderId] });
  return results[0] ?? null;
};

export const findOrderByTransaction = async (transactionId: string) => {
  const results = await loadOrderSlices({
    clause: "o.transaction_id = $1",
    values: [transactionId]
  });
  return results[0] ?? null;
};

export const createOrder = async (input: OrderCreateInput) => {
  const client = await getClient();
  const currency = input.currency ?? appConfig.defaultCurrency;
  const orderNumber =
    input.orderNumber ??
    `ORD-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;

  if (!input.items.length) {
    throw new Error("Order requires at least one line item.");
  }

  try {
    await client.query("BEGIN");

    const customerId = await upsertCustomer(client, input.customer);

    const shippingAddressId = await insertAddress(
      client,
      customerId,
      "shipping",
      input.shippingAddress
    );

    const billingAddressId = input.billingAddress
      ? await insertAddress(client, customerId, "billing", input.billingAddress)
      : shippingAddressId;

    const orderResult = await client.query<{ id: string }>(
      `
        INSERT INTO orders (
          id,
          order_number,
          customer_id,
          status,
          total_amount,
          currency,
          transaction_id,
          channel,
          note,
          placed_at,
          shipping_address_id,
          billing_address_id
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
          now(),
          $9,
          $10
        )
        RETURNING id
      `,
      [
        orderNumber,
        customerId,
        input.status ?? "processing",
        input.totalAmount,
        currency,
        input.transactionId,
        input.channel ?? "web",
        input.note ?? null,
        shippingAddressId,
        billingAddressId
      ]
    );

    const orderId = orderResult.rows[0].id;

    for (const item of input.items) {
      await insertOrderItem(client, orderId, item);
    }

    await insertPayment(client, orderId, input.transactionId, input.totalAmount, currency);

    await createOrderEvent(client, orderId, "ORDER_CREATED", input.note ?? null, {
      transactionId: input.transactionId,
      channel: input.channel ?? "web"
    });

    await client.query("COMMIT");

    return findOrderById(orderId);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const renderInvoicePdf = (
  order: OrderDashboardEntry,
  invoiceNumber: string,
  filePath: string
) => {
  return new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const stream = createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(20).text("Invoice", { align: "right" });
    doc.moveDown();

    doc.fontSize(12).text(`Invoice Number: ${invoiceNumber}`);
    doc.text(`Order Number: ${order.orderNumber}`);
    doc.text(`Transaction ID: ${order.transactionId}`);
    doc.text(`Placed At: ${new Date(order.placedAt).toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(12).text("Bill To:");
    doc.text(
      `${order.customer.firstName} ${order.customer.lastName}\n${order.customer.email}${
        order.customer.phone ? `\n${order.customer.phone}` : ""
      }`
    );

    if (order.shippingAddress) {
      doc.moveDown();
      doc.text("Ship To:");
      doc.text(
        [
          order.shippingAddress.line1,
          order.shippingAddress.line2,
          [
            order.shippingAddress.city,
            order.shippingAddress.state,
            order.shippingAddress.postalCode
          ]
            .filter(Boolean)
            .join(", "),
          order.shippingAddress.country
        ]
          .filter(Boolean)
          .join("\n")
      );
    }

    doc.moveDown();
    doc.text("Items:", { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    doc.font("Helvetica-Bold");
    doc.text("SKU", 72, tableTop);
    doc.text("Product", 140, tableTop);
    doc.text("Qty", 360, tableTop, { width: 40, align: "right" });
    doc.text("Unit Price", 410, tableTop, { width: 80, align: "right" });
    doc.text("Line Total", 500, tableTop, { width: 80, align: "right" });
    doc.moveTo(72, tableTop + 16).lineTo(560, tableTop + 16).stroke();

    let position = tableTop + 24;

    order.items.forEach((item) => {
      const lineTotal = item.unitPrice * item.quantity - (item.discount ?? 0) + (item.tax ?? 0);
      doc.font("Helvetica").text(item.sku, 72, position);
      doc.text(item.productName, 140, position, { width: 200 });
      doc.text(String(item.quantity), 360, position, { width: 40, align: "right" });
      doc.text(`${order.currency} ${item.unitPrice.toFixed(2)}`, 410, position, {
        width: 80,
        align: "right"
      });
      doc.text(`${order.currency} ${lineTotal.toFixed(2)}`, 500, position, {
        width: 80,
        align: "right"
      });
      position += 18;
    });

    doc.moveTo(72, position + 4).lineTo(560, position + 4).stroke();
    doc.font("Helvetica-Bold").text(
      `Total: ${order.currency} ${order.totalAmount.toFixed(2)}`,
      400,
      position + 12,
      { align: "right" }
    );

    doc.end();

    stream.on("finish", () => resolve());
    stream.on("error", (error) => reject(error));
  });
};

export const upsertInvoiceForOrder = async (orderId: string) => {
  const client = await getClient();

  try {
    const order = await findOrderById(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    const invoiceNumber =
      order.invoice?.invoiceNumber ??
      `INV-${new Date(order.placedAt).getFullYear()}-${randomUUID()
        .slice(0, 6)
        .toUpperCase()}`;

    const fileName = `${invoiceNumber}.pdf`;
    const absolutePath = path.join(appConfig.uploads.invoices, fileName);
    await renderInvoicePdf(order, invoiceNumber, absolutePath);
    const relativePath = path.relative(process.cwd(), absolutePath);

    const result = await client.query<InvoiceRow>(
      `
        INSERT INTO invoices (
          id,
          order_id,
          invoice_number,
          pdf_path,
          generated_at,
          total_amount,
          currency
        )
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          now(),
          $4,
          $5
        )
        ON CONFLICT (order_id)
        DO UPDATE SET
          invoice_number = EXCLUDED.invoice_number,
          pdf_path = EXCLUDED.pdf_path,
          generated_at = now(),
          total_amount = EXCLUDED.total_amount,
          currency = EXCLUDED.currency
        RETURNING *
      `,
      [order.id, invoiceNumber, relativePath, order.totalAmount, order.currency]
    );

    await createOrderEvent(client, orderId, "INVOICE_GENERATED", null, {
      invoiceNumber,
      pdfPath: relativePath
    });

    return {
      ...order,
      invoice: {
        id: result.rows[0].id,
        invoiceNumber: result.rows[0].invoice_number,
        pdfPath: result.rows[0].pdf_path,
        generatedAt: result.rows[0].generated_at.toISOString(),
        totalAmount: result.rows[0].total_amount,
        currency: result.rows[0].currency
      }
    } satisfies OrderDashboardEntry;
  } finally {
    client.release();
  }
};

export const upsertInvoiceByTransaction = async (transactionId: string) => {
  const order = await findOrderByTransaction(transactionId);
  if (!order) {
    throw new Error("Order not found for transaction");
  }
  return upsertInvoiceForOrder(order.id);
};

export const updateOrderStatus = async (orderId: string, nextStatus: string, actor = "admin.dashboard") => {
  const normalizedStatus = nextStatus.toLowerCase();
  if (!ALLOWED_ORDER_STATUSES.has(normalizedStatus)) {
    throw new Error("Unsupported order status");
  }

  const client = await getClient();

  try {
    await client.query("BEGIN");

    const currentResult = await client.query<{ status: string; order_number: string }>(
      "SELECT status, order_number FROM orders WHERE id = $1",
      [orderId]
    );

    if (!currentResult.rowCount) {
      throw new Error("Order not found");
    }

    const currentStatus = currentResult.rows[0].status;
    const orderNumber = currentResult.rows[0].order_number;

    if (currentStatus === normalizedStatus) {
      await client.query("ROLLBACK");
      return { orderNumber, status: currentStatus };
    }

    await client.query("UPDATE orders SET status = $2, updated_at = now() WHERE id = $1", [orderId, normalizedStatus]);

    await client.query(
      `
        INSERT INTO order_events (
          id,
          order_id,
          event_type,
          actor,
          note,
          metadata
        )
        VALUES (
          gen_random_uuid(),
          $1,
          'STATUS_UPDATED',
          $2,
          NULL,
          jsonb_build_object('previousStatus', $3, 'nextStatus', $4)
        )
      `,
      [orderId, actor, currentStatus, normalizedStatus]
    );

    await client.query("COMMIT");
    return { orderNumber, status: normalizedStatus };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const deleteOrder = async (orderId: string) => {
  const client = await getClient();

  try {
    await client.query("BEGIN");

    const invoiceResult = await client.query<{ pdf_path: string }>(
      "SELECT pdf_path FROM invoices WHERE order_id = $1",
      [orderId]
    );

    const deleteResult = await client.query("DELETE FROM orders WHERE id = $1", [orderId]);
    if (!deleteResult.rowCount) {
      throw new Error("Order not found");
    }

    await client.query("COMMIT");

    if (invoiceResult.rowCount) {
      const pdfPath = invoiceResult.rows[0].pdf_path;
      const absolute = path.resolve(process.cwd(), pdfPath);
      await fs
        .unlink(absolute)
        .catch(() => {
          /* swallow errors when removing old artifacts */
        });
    }
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
