type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

const mongoDiagnostics = () => {
  const mongoUri = process.env.MONGODB_URI?.trim() || "";
  const validScheme = /^mongodb(\+srv)?:\/\//.test(mongoUri);

  if (!mongoUri || !validScheme) {
    return {
      configured: Boolean(mongoUri),
      validScheme,
      database: null,
      uriHost: null
    };
  }

  try {
    const parsed = new URL(mongoUri);
    return {
      configured: true,
      validScheme: true,
      database: parsed.pathname.replace(/^\//, "") || "test",
      uriHost: parsed.host
    };
  } catch {
    return {
      configured: true,
      validScheme: false,
      database: null,
      uriHost: null
    };
  }
};

export default function handler(_req: unknown, res: VercelResponse) {
  return res.status(200).json({
    ok: true,
    api: "online",
    runtime: "vercel-node",
    mongo: mongoDiagnostics()
  });
}
