import { describe, expect, it } from "vitest";
import { loadConfig } from "./index";

const baseEnv = {
  DATABASE_URL: "postgresql://streamarr:streamarr@localhost:5432/streamarr",
  REDIS_URL: "redis://localhost:6379",
  SESSION_SECRET: "x".repeat(32),
  ENCRYPTION_KEY: "y".repeat(32),
  BROWSER_SOURCE_TOKEN_SECRET: "z".repeat(32),
};

describe("loadConfig", () => {
  it("parses required configuration", () => {
    expect(loadConfig(baseEnv).APP_NAME).toBe("streamarr");
  });

  it("rejects placeholder production secrets", () => {
    expect(() =>
      loadConfig({
        ...baseEnv,
        NODE_ENV: "production",
        SESSION_SECRET: "replace-with-at-least-32-characters",
      }),
    ).toThrow();
  });
});
