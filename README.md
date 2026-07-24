# streamarr

streamarr is a self-hosted live-stream creator platform for browser-source overlays, alerts, activity feeds, chatbot automation, assets and operational administration.

This repository is in the foundation phase. It contains the monorepo layout, application shell, validated configuration package, core overlay and event schemas, initial database model, Docker Compose stack, CI workflow and documentation requested by the supplied project brief.

## Quick Start

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Docker

```bash
cp .env.example .env
docker compose up -d
```

The default stack starts:

- `web`
- `worker`
- `postgres`
- `redis`

Optional local object storage is available with:

```bash
docker compose --profile storage up -d
```

## Project Status

Phase 0 and the first foundation slice are scaffolded. The current app is not production-ready and does not yet implement persistent authentication, live overlay editing, Redis event processing or platform integrations.

## Source Control And Releases

Use `main` as the protected default branch. Prefer focused branches such as `feature/overlay-editor`, `fix/browser-source-reconnect` and `docs/docker-installation`.

Use Conventional Commits where practical:

```bash
feat(editor): add alert-box layer controls
fix(events): prevent duplicate alert delivery
docs(self-hosting): add Caddy configuration
```

Release tags should follow semantic versioning:

```bash
git tag -s v0.1.0 -m "streamarr v0.1.0"
git push origin v0.1.0
```

Production documentation should use immutable version tags rather than `latest`.

## Documentation

- [Architecture](docs/architecture.md)
- [Implementation checklist](docs/implementation-checklist.md)
- [Installation](docs/installation.md)
- [Configuration](docs/configuration.md)
- [Backups](docs/backups.md)
- [Restore](docs/restore.md)
- [Security](docs/security.md)
- [Troubleshooting](docs/troubleshooting.md)

## License

No license has been selected yet. Until a license is added, the default copyright restrictions apply.
