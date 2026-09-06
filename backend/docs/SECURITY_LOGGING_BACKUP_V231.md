# FLOWLY V2.31 — Security, Logging & Backup

This phase hardens the backend without changing the locked frontend/showroom visuals.

## Security controls
- Helmet security headers and X-Powered-By disabled.
- Strict configured CORS origin with credentials.
- Global in-memory rate limiting plus stricter login and public-request limits.
- JSON/body size limit (default 256 KB).
- Recursive payload sanitization, prototype-pollution key stripping, depth/array caps, UUID validation, login/public request validation.
- Cookie-authenticated unsafe requests require the configured frontend Origin (CSRF origin guard). Bearer-token API clients are not subject to this browser-cookie check.
- Production startup fails unless JWT secret is strong, PostgreSQL is configured, AUTH_MODE=database, and FRONTEND_ORIGIN uses HTTPS.
- JWT issuer and audience are signed and verified.
- Production 5xx responses do not expose internal error details.
- PostgreSQL pool has explicit connection, idle, and maximum-size limits.
- Graceful SIGTERM/SIGINT shutdown closes the HTTP server and DB pool.

## Logging and audit
- API request logs are structured JSON and include request ID, route, status, duration, user ID and business ID where available.
- `security_audit_log` records authentication and mutation security events without passwords/tokens/cookies.
- Mutation audit events cover business profile, customer, lead, booking, task, workflow and intelligence changes.
- Failed login attempts are captured without storing the submitted password.

## Backup and restore
- `npm run backup:db` uses PostgreSQL `pg_dump` custom format and writes a SHA-256 checksum beside the dump.
- `npm run restore:db -- /path/file.dump` is blocked unless `CONFIRM_RESTORE=YES` is explicitly set.
- Restore verifies the checksum when a `.sha256` file is present.
- PostgreSQL client tools (`pg_dump` / `pg_restore`) must be installed on the host.
- Backup retention policy is documented through `BACKUP_RETENTION_DAYS`; automatic deletion is intentionally not performed by the script.

## Production notes
The in-memory rate limiter is appropriate for a single API instance. Before horizontally scaling, replace it with a shared store such as Redis or an edge/gateway rate limiter. Database backups should ultimately be scheduled outside the application process and copied to encrypted off-site/object storage with retention/versioning.
