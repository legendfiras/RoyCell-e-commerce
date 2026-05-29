export const config = {
  maxDuration: 15
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

const getMongoDiagnostics = () => {
  const mongoUri = process.env.MONGODB_URI?.trim() || "";
  const validScheme = /^mongodb(\+srv)?:\/\//.test(mongoUri);
  let database: string | null = null;
  let uriHost: string | null = null;

  if (validScheme) {
    try {
      const parsed = new URL(mongoUri);
      database = parsed.pathname.replace(/^\//, "") || "test";
      uriHost = parsed.host;
    } catch {
      database = null;
      uriHost = null;
    }
  }

  return {
    configured: Boolean(mongoUri),
    validScheme,
    database,
    uriHost
  };
};

const createMongoClient = async () => {
  const { MongoClient } = await import("mongodb");
  return new MongoClient(process.env.MONGODB_URI?.trim() || "", {
    tls: true,
    connectTimeoutMS: 8000,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 10000,
    maxPoolSize: 1
  });
};

export default async function handler(_req: unknown, res: VercelResponse) {
  const diagnostics = getMongoDiagnostics();

  if (!diagnostics.configured || !diagnostics.validScheme) {
    return res.status(500).json({
      ok: false,
      message: "MongoDB is not configured correctly",
      diagnostics
    });
  }

  try {
    const client = await createMongoClient();
    await client.connect();
    await client.db().admin().ping();
    await client.close();

    return res.status(200).json({
      ok: true,
      message: "MongoDB connected",
      diagnostics
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "MongoDB connection failed",
      detail: error instanceof Error ? error.message : "Unknown MongoDB error",
      diagnostics
    });
  }
}
