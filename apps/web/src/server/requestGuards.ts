type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

const localHostnames = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

function configuredAppOrigin(): string {
  return new URL(process.env.APP_URL ?? "http://localhost:3000").origin;
}

function isLocalDevelopmentAlias(origin: URL, expected: URL): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return (
    origin.protocol === expected.protocol &&
    origin.port === expected.port &&
    localHostnames.has(origin.hostname) &&
    localHostnames.has(expected.hostname)
  );
}

export function requireSameOrigin(request: Request): Response | null {
  const originHeader = request.headers.get("origin");

  if (!originHeader) {
    return null;
  }

  const origin = new URL(originHeader);
  const requestOrigin = new URL(request.url);
  const appOrigin = new URL(configuredAppOrigin());

  if (
    origin.origin !== requestOrigin.origin &&
    origin.origin !== appOrigin.origin &&
    !isLocalDevelopmentAlias(origin, requestOrigin) &&
    !isLocalDevelopmentAlias(origin, appOrigin)
  ) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  return null;
}

export function checkRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): Response | null {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return null;
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);

    return Response.json(
      { error: "Too many attempts. Try again shortly." },
      {
        headers: {
          "Retry-After": retryAfterSeconds.toString(),
        },
        status: 429,
      },
    );
  }

  existing.count += 1;
  return null;
}

export function clientKey(request: Request, suffix: string): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "local";

  return `${ip}:${suffix}`;
}
