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
