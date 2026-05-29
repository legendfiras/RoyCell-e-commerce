import mongoose from "mongoose";
import { assertMongoConfig, config } from "./config";

export const connectDb = async () => {
  assertMongoConfig();

  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return;
  }

  await mongoose.connect(config.mongoUri);
  console.log("MongoDB connected");
};

export const getDbHealth = () => ({
  state: mongoose.connection.readyState,
  stateName: ["disconnected", "connected", "connecting", "disconnecting"][
    mongoose.connection.readyState
  ] || "unknown",
  database: mongoose.connection.name || null,
  host: mongoose.connection.host || null
});
