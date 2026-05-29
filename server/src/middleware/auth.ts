import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { assertAuthConfig, config } from "../config";

export type AuthRequest = Request & {
  adminId?: string;
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    res.status(401).json({ message: "Missing token" });
    return;
  }

  try {
    assertAuthConfig();
    const payload = jwt.verify(token, config.jwtSecret) as { adminId: string };
    req.adminId = payload.adminId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
