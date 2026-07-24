# Upgrades

Recommended flow:

1. Back up the installation.
2. Review `.env.example` changes.
3. Pull a tagged release.
4. Pull or build images.
5. Run migrations.
6. Restart services.
7. Check `/health/ready`.
8. Verify a browser source.

Avoid `latest` for production deployments.
