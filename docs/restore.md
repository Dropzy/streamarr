# Restore

Restore into a clean installation after verifying the backup archive:

```bash
./scripts/restore/restore.sh ./backups/streamarr-YYYY-MM-DD.tar.gz
```

For production, stop writers before restore and verify `/health/ready` plus at least one browser source after restart.
