# Installation

## Local Development

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres redis
pnpm db:migrate
pnpm dev
```

## Docker Compose

```bash
cp .env.example .env
docker compose up -d
```

Do not expose PostgreSQL or Redis publicly. Put streamarr behind a reverse proxy with HTTPS for production browser-source URLs.
