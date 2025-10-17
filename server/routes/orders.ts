import { Router, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  createOrder,
  findOrderById,
  findOrderByTransaction,
  listOrders,
  upsertInvoiceByTransaction,
  upsertInvoiceForOrder
} from "../services/orderService";
import { OrderCreateInput, OrderItemInput } from "../types/orders";

const router = Router();

const ensureSuperadmin = (req: Request, res: Response): boolean => {
  const role = String(req.headers["x-admin-role"] ?? "").toLowerCase();
  if (role !== "superadmin") {
    res.status(403).json({ message: "Superadmin privileges are required for this action" });
    return false;
  }
  return true;
};

router.get("/", async (_req, res, next) => {
  try {
    const orders = await listOrders();
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.get("/transaction/:transactionId", async (req, res, next) => {
  try {
    const order = await findOrderByTransaction(req.params.transactionId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.get("/:orderId", async (req, res, next) => {
  try {
    const order = await findOrderById(req.params.orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
});

const parseItems = (items: unknown): OrderItemInput[] => {
  if (!Array.isArray(items)) {
    throw new Error("Items must be an array");
  }

  return items.map((raw) => {
    const quantity = Number(raw.quantity);
    const unitPrice = Number(raw.unitPrice);
    if (Number.isNaN(quantity) || Number.isNaN(unitPrice)) {
      throw new Error("Quantity and unit price must be numeric");
    }

    return {
      productId: String(raw.productId),
      sku: String(raw.sku),
      quantity,
      unitPrice,
      discount: raw.discount ? Number(raw.discount) : undefined,
      tax: raw.tax ? Number(raw.tax) : undefined
    };
  });
};

router.post("/", async (req, res, next) => {
  if (!ensureSuperadmin(req, res)) {
    return;
  }

  try {
    const payload = req.body as Partial<OrderCreateInput>;

    if (!payload.customer || !payload.shippingAddress || !payload.items) {
      res.status(400).json({ message: "Missing customer, shipping address, or items" });
      return;
    }

    const items = parseItems(payload.items);
    const totalAmount =
      payload.totalAmount !== undefined
        ? Number(payload.totalAmount)
        : items.reduce(
            (total, item) =>
              total + item.unitPrice * item.quantity - (item.discount ?? 0) + (item.tax ?? 0),
            0
          );

    if (Number.isNaN(totalAmount)) {
      res.status(400).json({ message: "Total amount must be numeric" });
      return;
    }

    const order = await createOrder({
      transactionId: payload.transactionId ?? randomUUID(),
      currency: payload.currency,
      channel: payload.channel,
      totalAmount,
      customer: {
        firstName: payload.customer.firstName,
        lastName: payload.customer.lastName,
        email: payload.customer.email,
        phone: payload.customer.phone
      },
      shippingAddress: payload.shippingAddress,
      billingAddress: payload.billingAddress ?? payload.shippingAddress,
      items,
      note: payload.note,
      status: payload.status ?? "processing",
      orderNumber: payload.orderNumber
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

router.post("/transaction/:transactionId/invoices", async (req, res, next) => {
  if (!ensureSuperadmin(req, res)) {
    return;
  }

  try {
    const order = await upsertInvoiceByTransaction(req.params.transactionId);
    res.status(201).json(order.invoice);
  } catch (error) {
    next(error);
  }
});

router.post("/:orderId/invoices", async (req, res, next) => {
  if (!ensureSuperadmin(req, res)) {
    return;
  }

  try {
    const order = await upsertInvoiceForOrder(req.params.orderId);
    res.status(201).json(order.invoice);
  } catch (error) {
    next(error);
  }
});

router.get("/transaction/:transactionId/invoice", async (req, res, next) => {
  try {
    const order = await findOrderByTransaction(req.params.transactionId);
    if (!order || !order.invoice) {
      res.status(404).json({ message: "Invoice not found" });
      return;
    }

    const filePath = path.resolve(process.cwd(), order.invoice.pdfPath);
    res.download(filePath);
  } catch (error) {
    next(error);
  }
});

router.get("/:orderId/invoice", async (req, res, next) => {
  try {
    const order = await findOrderById(req.params.orderId);
    if (!order || !order.invoice) {
      res.status(404).json({ message: "Invoice not found" });
      return;
    }

    const filePath = path.resolve(process.cwd(), order.invoice.pdfPath);
    res.download(filePath);
  } catch (error) {
    next(error);
  }
});

export default router;
