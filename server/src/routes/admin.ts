import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AdminUser } from "../models/AdminUser";
import { requireAdmin } from "../middleware/auth";

export const adminRouter = Router();

const signToken = (adminId: string) =>
  jwt.sign({ adminId }, config.jwtSecret, { expiresIn: "8h" });

adminRouter.get("/status", async (_req, res) => {
  const hasAdmin = (await AdminUser.countDocuments()) > 0;
  res.json({ hasAdmin });
});

adminRouter.post("/setup", async (req, res) => {
  const hasAdmin = (await AdminUser.countDocuments()) > 0;
  if (hasAdmin) {
    res.status(409).json({ message: "Admin already exists" });
    return;
  }

  const { username, password } = req.body;

  if (!username || !password || password.length < 8) {
    res.status(400).json({ message: "Username and password of at least 8 characters are required" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await AdminUser.create({ username, passwordHash });
  res.status(201).json({ token: signToken(String(admin._id)) });
});

adminRouter.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const admin = await AdminUser.findOne({ username });

  if (!admin || !(await bcrypt.compare(password || "", admin.passwordHash))) {
    res.status(401).json({ message: "Invalid username or password" });
    return;
  }

  res.json({ token: signToken(String(admin._id)) });
});

adminRouter.post("/reset-password", async (req, res) => {
  const { resetKey, username, password } = req.body;
  if (resetKey !== config.adminSetupKey) {
    res.status(403).json({ message: "Invalid reset key" });
    return;
  }

  if (!username || !password || password.length < 8) {
    res.status(400).json({ message: "Username and new password are required" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await AdminUser.findOneAndUpdate({ username }, { passwordHash }, { new: true });
  if (!admin) {
    res.status(404).json({ message: "Admin not found" });
    return;
  }

  res.json({ message: "Password reset" });
});

adminRouter.get("/me", requireAdmin, async (req, res) => {
  res.json({ ok: true });
});
