import { app } from "../server/src/app";
import { connectDb } from "../server/src/db";

export default async function handler(req: unknown, res: unknown) {
  await connectDb();
  return app(req as never, res as never);
}
