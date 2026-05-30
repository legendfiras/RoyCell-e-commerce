import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import { Order } from "../models/Order.js";

export const ordersRouter = Router();

ordersRouter.post("/", async (req, res) => {
  try {
    const { customer, items, total, status } = req.body;

    if (
      !customer?.firstName ||
      !customer?.lastName ||
      !customer?.phone ||
      !customer?.city ||
      !customer?.street ||
      !Array.isArray(items) ||
      !items.length ||
      typeof total !== "number"
    ) {
      res.status(400).json({ message: "Customer details, items, and total are required" });
      return;
    }

    const order = await Order.create({ customer, items, total, status });
    res.status(201).json({ id: String(order._id), createdAt: order.createdAt });
  } catch {
    res.status(400).json({ message: "Order could not be saved" });
  }
});

ordersRouter.get("/", requireAdmin, async (_req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(
    orders.map((order: any) => ({
      id: String(order._id),
      createdAt: order.createdAt,
      customer: order.customer,
      items: order.items,
      total: order.total,
      status: order.status
    }))
  );
});

ordersRouter.delete("/", requireAdmin, async (_req, res) => {
  await Order.deleteMany({});
  res.status(204).send();
});
