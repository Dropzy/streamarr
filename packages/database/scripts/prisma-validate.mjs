import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://streamarr:streamarr@localhost:5432/streamarr",
};

const result = spawnSync("pnpm", ["exec", "prisma", "validate"], {
  env,
  shell: true,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
