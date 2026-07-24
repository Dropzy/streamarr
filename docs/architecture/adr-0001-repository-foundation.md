# ADR 0001: Repository Foundation

## Status

Accepted

## Context

The supplied brief requires a self-hosted platform with no mandatory streamarr-operated service, a Docker Compose deployment path, React creator interfaces, Node services, PostgreSQL, Redis, Zod validation and Prisma-managed data models.

## Decision

Use a pnpm workspace with Turborepo-style task orchestration:

- `apps/web`: Next.js application for creator, admin and browser-source routes.
- `apps/worker`: Node worker process for event queue processing.
- `packages/config`: typed environment validation.
- `packages/validation`: shared overlay and event schemas.
- `packages/database`: Prisma schema and migration ownership.
- `packages/auth`, `events`, `storage`, `integrations`, `observability`, `ui`, `testing`: bounded packages for later implementation phases.

The default deployment uses Docker Compose with `web`, `worker`, `postgres` and `redis`, plus optional MinIO.

## Consequences

The repository can evolve phase by phase without a hosted control plane. Business rules can move into packages and stay testable outside route handlers. The first implementation does not yet provide a complete vertical slice; it establishes the compileable foundation for that work.
