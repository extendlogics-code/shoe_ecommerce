import express from "express";
import ordersRouter from "./routes/orders";
import productsRouter from "./routes/products";
import adminAuthRouter from "./routes/adminAuth";
import { appConfig } from "./config";
import { ensureDirectories } from "./utils/fileSystem";
import { ensureDatabaseBootstrap } from "./startup";

ensureDirectories([
  appConfig.uploads.root,
  appConfig.uploads.productImages,
  appConfig.uploads.invoices
]);

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(appConfig.uploads.root));

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminAuthRouter);

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: error.message });
});

const port = appConfig.port;

const start = async () => {
  await ensureDatabaseBootstrap();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start API server", error);
  process.exit(1);
});

export default app;
