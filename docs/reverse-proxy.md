# Reverse Proxy

streamarr should be served over HTTPS in production. Example configurations live in:

- `deploy/caddy/Caddyfile`
- `deploy/nginx/streamarr.conf`
- `deploy/traefik/dynamic.yml`

Proxy WebSocket upgrade headers and configure `APP_URL` as the canonical public address.
