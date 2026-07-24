#!/usr/bin/env sh
set -eu

archive="${1:-}"
if [ -z "$archive" ]; then
  echo "Usage: ./scripts/restore/restore.sh ./backups/streamarr-YYYY-MM-DD.tar.gz" >&2
  exit 1
fi

tmp="$(mktemp -d)"
tar -xzf "$archive" -C "$tmp"
sql="$(find "$tmp" -name '*.sql' | head -n 1)"
docker compose exec -T postgres psql -U streamarr streamarr < "$sql"
echo "Restored database from $archive"
