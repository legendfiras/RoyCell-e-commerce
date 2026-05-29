import { MongoClient } from "mongodb";

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

const isMongoUri = (value: string) => /^mongodb(\+srv)?:\/\//.test(value);

export default async function handler(_req: unknown, res: VercelResponse) {
  const mongoUri = process.env.MONGODB_URI?.trim() || "";

  if (!mongoUri) {
    return res.status(500).json({
      ok: false,
      api: "online",
      message: "Missing required environment variable: MONGODB_URI"
    });
  }

  if (!isMongoUri(mongoUri)) {
    return res.status(500).json({
      ok: false,
      api: "online",
      message: "Invalid MONGODB_URI. It must start with mongodb:// or mongodb+srv://."
    });
  }

  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const database = client.db().databaseName;
    await client.db().admin().ping();
    await client.close();

    return res.status(200).json({
      ok: true,
      api: "online",
      db: { stateName: "connected", database }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      api: "online",
      message: "MongoDB connection failed",
      detail: error instanceof Error ? error.message : "Unknown MongoDB error"
    });
  }
}
