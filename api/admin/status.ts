import { MongoClient } from "mongodb";

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

const isMongoUri = (value: string) => /^mongodb(\+srv)?:\/\//.test(value);

export default async function handler(_req: unknown, res: VercelResponse) {
  const mongoUri = process.env.MONGODB_URI?.trim() || "";

  if (!mongoUri || !isMongoUri(mongoUri)) {
    return res.status(500).json({
      message: "MongoDB is not configured correctly",
      detail: "Set MONGODB_URI in Vercel and make sure it starts with mongodb:// or mongodb+srv://."
    });
  }

  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const hasAdmin = (await client.db().collection("adminusers").countDocuments()) > 0;
    await client.close();

    return res.status(200).json({ hasAdmin });
  } catch (error) {
    return res.status(500).json({
      message: "Could not read admin status from MongoDB",
      detail: error instanceof Error ? error.message : "Unknown MongoDB error"
    });
  }
}
