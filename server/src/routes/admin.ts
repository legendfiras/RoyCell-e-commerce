import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomInt } from "node:crypto";
import { assertAdminResetConfig, assertAuthConfig, config } from "../config.js";
import { AdminUser } from "../models/AdminUser.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendAdminOtpEmail } from "../mailer.js";

export const adminRouter = Router();

const signToken = (adminId: string) =>
  jwt.sign({ adminId }, config.jwtSecret, { expiresIn: "8h" });

const generateOtp = () => String(randomInt(100000, 1000000));

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
    res.status(400).json({
      message: "Username and password of at least 8 characters are required"
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  assertAuthConfig();

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

  assertAuthConfig();

  res.json({ token: signToken(String(admin._id)) });
});

/**
 * NEW ROUTE 1:
 * Sends OTP to admin email.
 */
adminRouter.post("/request-reset-otp", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    res.status(400).json({ message: "Username is required" });
    return;
  }

  const admin = await AdminUser.findOne({ username });

  if (!admin) {
    res.status(404).json({ message: "Admin not found" });
    return;
  }

  const otp = generateOtp();

  const resetOtpHash = await bcrypt.hash(otp, 12);

  const resetOtpExpiresAt = new Date(
    Date.now() + config.otpExpiryMinutes * 60 * 1000
  );

  await AdminUser.updateOne(
    { _id: admin._id },
    {
      $set: {
        resetOtpHash,
        resetOtpExpiresAt,
        resetOtpAttempts: 0
      }
    }
  );

  try {
    await sendAdminOtpEmail(otp);
  } catch (error) {
    await AdminUser.updateOne(
      { _id: admin._id },
      {
        $unset: {
          resetOtpHash: "",
          resetOtpExpiresAt: "",
          resetOtpAttempts: ""
        }
      }
    );

    res.status(500).json({ message: "Could not send OTP email" });
    return;
  }

  res.json({ message: "OTP sent to admin email" });
});

/**
 * NEW ROUTE 2:
 * Confirms OTP and changes password.
 */
adminRouter.post("/confirm-reset-otp", async (req, res) => {
  const { username, otp, password } = req.body;

  if (!username || !otp || !password || password.length < 8) {
    res.status(400).json({
      message: "Username, OTP, and new password of at least 8 characters are required"
    });
    return;
  }

  if (!/^\d{6}$/.test(String(otp))) {
    res.status(400).json({ message: "OTP must be 6 digits" });
    return;
  }

  const admin = await AdminUser.findOne({ username });

  if (!admin) {
    res.status(404).json({ message: "Admin not found" });
    return;
  }

  const resetOtpHash = admin.get("resetOtpHash") as string | undefined;
  const resetOtpExpiresAt = admin.get("resetOtpExpiresAt") as Date | undefined;
  const resetOtpAttempts = Number(admin.get("resetOtpAttempts") || 0);

  if (!resetOtpHash || !resetOtpExpiresAt) {
    res.status(400).json({ message: "No active OTP request found" });
    return;
  }

  if (resetOtpExpiresAt.getTime() < Date.now()) {
    res.status(400).json({ message: "OTP expired" });
    return;
  }

  if (resetOtpAttempts >= 5) {
    res.status(429).json({ message: "Too many incorrect OTP attempts" });
    return;
  }

  const otpMatches = await bcrypt.compare(String(otp), resetOtpHash);

  if (!otpMatches) {
    await AdminUser.updateOne(
      { _id: admin._id },
      { $inc: { resetOtpAttempts: 1 } }
    );

    res.status(403).json({ message: "Invalid OTP" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await AdminUser.updateOne(
    { _id: admin._id },
    {
      $set: { passwordHash },
      $unset: {
        resetOtpHash: "",
        resetOtpExpiresAt: "",
        resetOtpAttempts: ""
      }
    }
  );

  res.json({ message: "Password reset" });
});

/**
 * OLD ROUTE:
 * Keep it for now until email OTP is tested successfully.
 */
adminRouter.post("/reset-password", async (req, res) => {
  const { resetKey, username, password } = req.body;

  assertAdminResetConfig();

  if (resetKey !== config.adminSetupKey) {
    res.status(403).json({ message: "Invalid reset key" });
    return;
  }

  if (!username || !password || password.length < 8) {
    res.status(400).json({
      message: "Username and new password are required"
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await AdminUser.findOneAndUpdate(
    { username },
    { passwordHash },
    { new: true }
  );

  if (!admin) {
    res.status(404).json({ message: "Admin not found" });
    return;
  }

  res.json({ message: "Password reset" });
});

adminRouter.get("/me", requireAdmin, async (_req, res) => {
  res.json({ ok: true });
});