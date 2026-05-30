import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { getDbHealth } from "./db.js";
import { adminRouter } from "./routes/admin.js";
import { productsRouter } from "./routes/products.js";
import { ordersRouter } from "./routes/orders.js";

export const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    }
  })
);
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
    }
  });
  next();
});

app.get("/api/health", (_req, res) => {
  const db = getDbHealth();
  res.json({
    ok: db.stateName === "connected",
    api: "online",
    db,
    uptimeSeconds: Math.round(process.uptime())
  });
});

app.use("/api/admin", adminRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route not found" });
});

const distDir = fileURLToPath(new URL("../../dist", import.meta.url));
const indexHtml = fileURLToPath(new URL("../../dist/index.html", import.meta.url));

if (existsSync(indexHtml)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      res.sendFile(indexHtml);
      return;
    }

    next();
  });
}

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: "Server error", detail: error.message });
});
