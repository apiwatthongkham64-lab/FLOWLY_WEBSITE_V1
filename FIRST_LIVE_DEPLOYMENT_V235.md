# FLOWLY V2.35 — First Live Deployment

This release packages the first production deployment procedure for the V2.34 environment foundation. It does **not** claim that an external server/domain has already been deployed.

## Run order

1. Generate `.env.production` on the target server.
2. Verify DNS and TLS/reverse-proxy arrangement for your domain.
3. Run `deploy/first-live-deploy.ps1` on Windows or `sh deploy/first-live-deploy.sh` on Linux.
4. The deploy script validates environment, validates Compose, builds images, starts PostgreSQL, runs migrations, starts API/Web, then executes smoke tests.
5. Check runtime with `deploy/status.ps1` or `sh deploy/status.sh`.

## Safety

- PostgreSQL is not published to the public host.
- Database data is stored in named volume `flowly_pgdata`.
- Rollback scripts stop Web/API only and never run `docker compose down -v`.
- Migrations run before API/Web are brought up.
- Smoke tests verify web health, API health through Nginx, and homepage availability.

## HTTPS

The app requires production origins to be HTTPS. TLS termination can be provided by the target host/load balancer/reverse proxy. The bundled Nginx container remains the internal web/API reverse proxy on HTTP.

## Not yet verified in this build environment

Docker is not installed in the current build environment, so image build, PostgreSQL startup, migration execution against a live database, and external domain/HTTPS verification must be performed on the actual deployment host.
