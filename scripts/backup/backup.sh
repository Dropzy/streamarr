#!/usr/bin/env sh
set -eu

stamp="$(date +%Y-%m-%d-%H%M%S)"
mkdir -p backups
docker compose exec -T postgres pg_dump -U streamarr streamarr > "backups/streamarr-${stamp}.sql"
tar -czf "backups/streamarr-${stamp}.tar.gz" "backups/streamarr-${stamp}.sql" data 2>/dev/null || true
echo "Created backups/streamarr-${stamp}.tar.gz"
