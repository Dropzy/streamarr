# Backups

The default local backup scope is:

- PostgreSQL database dump.
- Local asset directory when `STORAGE_DRIVER=local`.
- Application version and schema version once release metadata is implemented.

Run:

```bash
./scripts/backup/backup.sh
```

S3-compatible storage requires provider-specific backup policy outside this repository.
