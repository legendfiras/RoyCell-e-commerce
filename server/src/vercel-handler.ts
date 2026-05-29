import { app } from "./app";
import { connectDb } from "./db";

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

export default async function handler(req: unknown, res: unknown) {
  try {
    await connectDb();
    return app(req as never, res as never);
  } catch (error) {
    const message = error instanceof Error ? error.message : "API failed to start";
    return (res as VercelResponse).status(500).json({
      message: "API configuration or database connection failed",
      detail: message
    });
  }
}
