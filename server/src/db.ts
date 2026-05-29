import mongoose from "mongoose";
import { config } from "./config";

export const connectDb = async () => {
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
