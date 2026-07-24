import { createHmac, randomBytes } from "node:crypto";

function tokenSecret(): string {
  const secret = process.env.BROWSER_SOURCE_TOKEN_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "BROWSER_SOURCE_TOKEN_SECRET must be at least 32 characters.",
    );
  }

  return secret;
}

export function createBrowserSourceToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashBrowserSourceToken(token: string): string {
  return createHmac("sha256", tokenSecret()).update(token).digest("base64url");
}
