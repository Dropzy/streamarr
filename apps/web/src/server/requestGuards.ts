type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

export function requireSameOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");

  if (!origin) {
    return null;
  }

  const requestOrigin = new URL(request.url).origin;

  if (origin !== requestOrigin) {
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
