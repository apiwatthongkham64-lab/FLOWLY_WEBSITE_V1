# FLOWLY Production Deployment Checklist V2.32

## Before deploy
- [ ] Domain/DNS points to deployment host.
- [ ] HTTPS certificate/reverse proxy is ready.
- [ ] `.env.production` created from example and excluded from source control.
- [ ] Strong PostgreSQL password and JWT secret generated.
- [ ] `AUTH_MODE=database`.
- [ ] Production `APP_ORIGIN` and `FRONTEND_ORIGIN` match exactly.
- [ ] Backup taken and checksum stored.
- [ ] `npm run check`, database, integration, auth, workflow, AI, security and deployment checks pass.

## Deploy
- [ ] Start PostgreSQL.
- [ ] Apply migrations.
- [ ] Build/start API and web containers.
- [ ] Confirm all containers healthy.
- [ ] Confirm `/healthz` and `/api/v1/health` return success.
- [ ] Verify login/logout/session expiry.
- [ ] Submit one test Customer Front request and verify DB/workflow creation.
- [ ] Verify audit log is written.

## After deploy
- [ ] Check application/security logs for errors.
- [ ] Verify backup job location and retention.
- [ ] Restrict firewall to HTTP/HTTPS + admin SSH only; do not publish PostgreSQL.
- [ ] Document rollback image/version and DB restore point.
