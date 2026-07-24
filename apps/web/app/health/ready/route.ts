import { loadConfig } from "@streamarr/config";

export function GET() {
  const config = loadConfig(process.env);

  return Response.json({
    ok: true,
    checks: {
      config: "ok",
      database: config.DATABASE_URL ? "configured" : "missing",
      redis: config.REDIS_URL ? "configured" : "missing",
      storage: config.STORAGE_DRIVER,
    },
  });
}
