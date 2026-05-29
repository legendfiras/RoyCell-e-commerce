import { createMongoClient, getMongoDiagnostics } from "./_mongo";

export const config = {
  maxDuration: 15
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

export default async function handler(_req: unknown, res: VercelResponse) {
  const diagnostics = getMongoDiagnostics();

  if (!diagnostics.configured) {
    return res.status(500).json({
      ok: false,
      api: "online",
      message: "Missing required environment variable: MONGODB_URI",
      diagnostics
    });
  }

  if (!diagnostics.validScheme) {
    return res.status(500).json({
      ok: false,
      api: "online",
      message: "Invalid MONGODB_URI. It must start with mongodb:// or mongodb+srv://.",
      diagnostics
    });
  }

  try {
    const client = await createMongoClient();
    await client.connect();
    const database = client.db().databaseName;
    await client.db().admin().ping();
    await client.close();

    return res.status(200).json({
      ok: true,
      api: "online",
      db: { stateName: "connected", database, uriHost: diagnostics.uriHost }
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      api: "online",
      message: "MongoDB connection failed",
      detail: error instanceof Error ? error.message : "Unknown MongoDB error",
      diagnostics
    });
  }
}
