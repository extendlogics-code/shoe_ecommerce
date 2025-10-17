import { Router, type Request, type Response } from "express";
import multer from "multer";
import path from "node:path";
import { appConfig } from "../config";
import { ensureDirectory } from "../utils/fileSystem";
import { createProduct, deleteProductById, listProducts, listRecentProducts, updateProduct } from "../services/productService";

const router = Router();

ensureDirectory(appConfig.uploads.productImages);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, appConfig.uploads.productImages);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const base = path.basename(file.originalname, extension).replace(/\s+/g, "-").toLowerCase();
    const timestamp = Date.now();
    cb(null, `${base}-${timestamp}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are allowed"));
      return;
    }
    cb(null, true);
  }
});

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
    const products = await listProducts();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.get("/new", async (req, res, next) => {
  try {
    const limitParam = Number(req.query.limit ?? 12);
    const limit = Number.isNaN(limitParam) ? 12 : Math.max(1, Math.min(limitParam, 50));
    const products = await listRecentProducts(limit);
    res.json(products);
  } catch (error) {
    next(error);
  }
});

const parseCsv = (value?: string | string[]): string[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => String(entry).split(/[,\n]/))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return String(value)
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

router.post("/", upload.single("image"), async (req, res, next) => {
  if (!ensureSuperadmin(req, res)) {
    return;
  }

  try {
    const { 
      name, 
      sku, 
      description, 
      productDetails,
      productStory,
      materialInfo,
      careInstructions,
      features,
      price, 
      currency, 
      inventoryOnHand, 
      inventoryReserved, 
      safetyStock, 
      reorderPoint, 
      imageAlt, 
      colors, 
      sizes, 
      category 
    } = req.body;

    const priceValue = Number(price);
    if (Number.isNaN(priceValue)) {
      res.status(400).json({ message: "Price must be numeric" });
      return;
    }

    if (category && !['mens', 'womens', 'kids'].includes(category)) {
      res.status(400).json({ message: "Invalid category value. Must be one of: mens, womens, kids" });
      return;
    }

    const product = await createProduct({
      name,
      sku,
      description,
      productDetails: productDetails ? JSON.parse(productDetails) : undefined,
      productStory: productStory ?? undefined,
      materialInfo: materialInfo ?? undefined,
      careInstructions: careInstructions ? JSON.parse(careInstructions) : undefined,
      features: features ? JSON.parse(features) : undefined,
      price: priceValue,
      currency: currency ?? undefined,
      status: "active",
      category: category ?? undefined,
      colors: parseCsv(colors),
      sizes: parseCsv(sizes),
      inventory: {
        onHand: Number(inventoryOnHand ?? 0),
        reserved: Number(inventoryReserved ?? 0),
        safetyStock: Number.isNaN(Number(safetyStock)) ? undefined : Number(safetyStock),
        reorderPoint: Number.isNaN(Number(reorderPoint)) ? undefined : Number(reorderPoint)
      },
      imagePath: req.file ? path.relative(process.cwd(), req.file.path) : undefined,
      imageAlt: imageAlt ?? undefined
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

router.delete("/:productId", async (req, res, next) => {
  if (!ensureSuperadmin(req, res)) {
    return;
  }

  try {
    await deleteProductById(req.params.productId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.put("/:productId", upload.single("image"), async (req, res, next) => {
  if (!ensureSuperadmin(req, res)) {
    return;
  }

  try {
    const {
      name,
      sku,
      description,
      productDetails,
      productStory,
      materialInfo,
      careInstructions,
      features,
      price,
      currency,
      status,
      category,
      inventoryOnHand,
      inventoryReserved,
      safetyStock,
      reorderPoint,
      imageAlt,
      colors,
      sizes
    } = req.body;

    const priceValue = Number(price);
    if (Number.isNaN(priceValue)) {
      res.status(400).json({ message: "Price must be numeric" });
      return;
    }

    if (category && !['mens', 'womens', 'kids'].includes(category)) {
      res.status(400).json({ message: "Invalid category value. Must be one of: mens, womens, kids" });
      return;
    }

    const product = await updateProduct(req.params.productId, {
      name,
      sku,
      description,
      productDetails: productDetails ? JSON.parse(productDetails) : undefined,
      productStory: productStory ?? undefined,
      materialInfo: materialInfo ?? undefined,
      careInstructions: careInstructions ? JSON.parse(careInstructions) : undefined,
      features: features ? JSON.parse(features) : undefined,
      price: priceValue,
      currency: currency ?? undefined,
      status: status ?? "active",
      category: category ?? undefined,
      colors: parseCsv(colors),
      sizes: parseCsv(sizes),
      inventory: {
        onHand: Number(inventoryOnHand ?? 0),
        reserved: Number(inventoryReserved ?? 0),
        safetyStock: Number.isNaN(Number(safetyStock)) ? undefined : Number(safetyStock),
        reorderPoint: Number.isNaN(Number(reorderPoint)) ? undefined : Number(reorderPoint)
      },
      imagePath: req.file ? path.relative(process.cwd(), req.file.path) : undefined,
      imageAlt: imageAlt ?? undefined
    });

    res.json(product);
  } catch (error) {
    next(error);
  }
});

export default router;
