# Contributing

Use focused branches and clear, imperative commits. Conventional Commits are recommended.

Before opening a pull request:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Pull requests should explain the problem, implementation decisions, testing performed, migrations, configuration changes, security implications and screenshots for visible UI changes.

Do not commit secrets, environment files, browser-source tokens, private logs, database backups or uploaded creator assets.
