# Configuration

Configuration is validated by `@streamarr/config`.

Required production secrets:

- `SESSION_SECRET`
- `ENCRYPTION_KEY`
- `BROWSER_SOURCE_TOKEN_SECRET`

Optional integrations should not be required for boot. Twitch, YouTube, SMTP, S3, telemetry and error monitoring are configured only when their features are enabled.
