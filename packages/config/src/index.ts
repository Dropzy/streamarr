import { z } from "zod";

const booleanFromString = z
  .union([z.boolean(), z.string()])
  .transform((value) => value === true || value === "true");

export const configSchema = z
  .object({
    APP_URL: z.string().url().default("http://localhost:3000"),
    APP_NAME: z.string().min(1).default("streamarr"),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    TRUST_PROXY: booleanFromString.default(false),
    REGISTRATION_ENABLED: booleanFromString.default(false),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    SESSION_SECRET: z.string().min(32),
    ENCRYPTION_KEY: z.string().min(32),
    BROWSER_SOURCE_TOKEN_SECRET: z.string().min(32),
    STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
    STORAGE_LOCAL_PATH: z.string().default("./data/uploads"),
    S3_ENDPOINT: z.string().optional().default(""),
    S3_REGION: z.string().optional().default(""),
    S3_BUCKET: z.string().optional().default(""),
    S3_ACCESS_KEY_ID: z.string().optional().default(""),
    S3_SECRET_ACCESS_KEY: z.string().optional().default(""),
    S3_FORCE_PATH_STYLE: booleanFromString.default(true),
    SMTP_HOST: z.string().optional().default(""),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().optional().default(""),
    SMTP_PASSWORD: z.string().optional().default(""),
    SMTP_FROM: z.string().optional().default(""),
    TWITCH_CLIENT_ID: z.string().optional().default(""),
    TWITCH_CLIENT_SECRET: z.string().optional().default(""),
    TWITCH_REDIRECT_URI: z.string().optional().default(""),
    YOUTUBE_CLIENT_ID: z.string().optional().default(""),
    YOUTUBE_CLIENT_SECRET: z.string().optional().default(""),
    YOUTUBE_REDIRECT_URI: z.string().optional().default(""),
    LOG_LEVEL: z
      .enum(["trace", "debug", "info", "warn", "error"])
      .default("info"),
    METRICS_ENABLED: booleanFromString.default(false),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional().default(""),
    SENTRY_DSN: z.string().optional().default(""),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV === "production") {
      for (const key of [
        "SESSION_SECRET",
        "ENCRYPTION_KEY",
        "BROWSER_SOURCE_TOKEN_SECRET",
      ] as const) {
        if (value[key].startsWith("replace-with")) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: "Production secrets must not use placeholders.",
          });
        }
      }
    }
  });

export type StreamarrConfig = z.infer<typeof configSchema>;

export function loadConfig(input: NodeJS.ProcessEnv): StreamarrConfig {
  return configSchema.parse(input);
}
