# Security

Security requirements from the brief:

- No default production password.
- First administrator is created through setup only.
- Argon2id or equivalent password hashing.
- Secure HTTP-only session cookies.
- CSRF protection.
- Rate limiting for authentication.
- Server-side authorization on every workspace operation.
- Encrypted platform integration secrets.
- Hashed browser-source tokens where practical.
- Safe template interpolation without `eval`.
- Upload validation and safe media URL handling.
- Secret redaction in logs.

Report vulnerabilities privately according to [SECURITY.md](../SECURITY.md).
