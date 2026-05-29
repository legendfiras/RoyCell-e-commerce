export type MongoDiagnostics = {
  configured: boolean;
  validScheme: boolean;
  database: string | null;
  uriHost: string | null;
};

export const getMongoDiagnostics = () => {
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

export const createMongoClient = async () => {
  const { MongoClient } = await import("mongodb");
  const mongoUri = process.env.MONGODB_URI?.trim() || "";
  return new MongoClient(mongoUri, {
    tls: true,
    connectTimeoutMS: 8000,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 10000,
    maxPoolSize: 1
  });
};
