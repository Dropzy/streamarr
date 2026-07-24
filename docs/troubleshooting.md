# Troubleshooting

## Readiness Fails

Check:

- `DATABASE_URL`
- `REDIS_URL`
- storage driver settings
- pending migrations once migrations are implemented

## Browser Source Does Not Connect

Check reverse proxy WebSocket support and confirm `APP_URL` is the public address used by OBS.
