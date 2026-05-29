import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const parseList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const defaultClientOrigins = ["http://127.0.0.1:5173", "http://localhost:5173"];
const mongoUriPattern = /^mongodb(\+srv)?:\/\//;

export const config = {
  mongoUri: process.env.MONGODB_URI?.trim() || "",
  jwtSecret: process.env.JWT_SECRET?.trim() || "",
  adminSetupKey: process.env.ADMIN_SETUP_KEY?.trim() || "",
  port: Number(process.env.PORT || 4000),
  clientOrigins: process.env.CLIENT_ORIGIN
    ? parseList(process.env.CLIENT_ORIGIN)
    : defaultClientOrigins
};

export const assertConfig = () => {
  const missing = [
    !config.mongoUri && "MONGODB_URI",
    !config.jwtSecret && "JWT_SECRET",
    !config.adminSetupKey && "ADMIN_SETUP_KEY"
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (!mongoUriPattern.test(config.mongoUri)) {
    throw new Error(
      "Invalid MONGODB_URI. Paste the full MongoDB connection string from Atlas; it must start with mongodb:// or mongodb+srv://."
    );
  }

  if (config.jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long.");
  }

  if (config.adminSetupKey.length < 24) {
    throw new Error("ADMIN_SETUP_KEY must be at least 24 characters long.");
  }
};
