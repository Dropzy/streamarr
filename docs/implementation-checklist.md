# Implementation Checklist

## Phase 0: Repository Foundation

- [x] Create monorepo structure.
- [x] Add package scripts for development, linting, type checking, tests, build and Prisma commands.
- [x] Add `.gitignore`, `.gitattributes`, `.editorconfig` and `.env.example`.
- [x] Add CI, Dependabot, issue templates and pull request template.
- [x] Add initial architecture decision record.
- [x] Add Docker Compose service design.
- [x] Add database model outline through Prisma schema.

## Phase 1: Repository And Deployment

- [x] Add web and worker Dockerfiles.
- [x] Add PostgreSQL and Redis services.
- [x] Add typed environment validation.
- [x] Add `/health/live` and `/health/ready`.
- [x] Add first Prisma migration.
- [ ] Add production image publishing.
- [ ] Add migration compatibility check to readiness.

## Phase 2: Installation And Authentication

- [x] Implement first-run setup transaction.
- [x] Add secure password hashing.
- [x] Add secure HTTP-only sessions.
- [x] Add same-origin POST checks for setup/auth APIs.
- [x] Add login rate limiting.
- [x] Add password reset workflow.
- [x] Add protected app and admin route layouts.

## Phase 3: Application Shell

- [x] Add creator dashboard route.
- [x] Add workspace settings placeholders.
- [x] Add overlay list route.
- [x] Add admin shell and health routes.
- [ ] Add persisted workspace selector.
- [ ] Add audit logging service.

## Phase 4: Overlay Editor

- [x] Add shared overlay schema.
- [x] Add starter Overlay Studio route.
- [x] Add database-backed overlay creation.
- [x] Add workspace-scoped overlay list.
- [x] Load overlay drafts from PostgreSQL in the editor.
- [x] Add autosave endpoint for validated draft documents.
- [x] Add editable alert-box headline, body, position and duration controls.
- [ ] Add drag, resize and selection state.
- [x] Add autosave.
- [ ] Add undo and redo transaction grouping.
- [ ] Add schema-driven inspector controls.

## Phase 5: Publishing

- [x] Implement publish transaction.
- [x] Add immutable overlay versions.
- [x] Add browser-source token generation and rotation.
- [x] Add rollback.

## Phase 6: Event System

- [x] Add normalized event envelope schema.
- [x] Add safe alert-template interpolation.
- [x] Persist events.
- [x] Enqueue through Redis.
- [x] Add idempotency service.
- [x] Add delivery attempts and dead-letter handling.

## Phase 7: Browser Source

- [x] Add tokenized browser-source route placeholder.
- [x] Load currently published overlay by token.
- [x] Add local WebSocket gateway.
- [x] Add alert queue and acknowledgement.
- [x] Add reconnect and diagnostics mode.
