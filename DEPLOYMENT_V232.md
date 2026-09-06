# FLOWLY V2.32 — Deployment Foundation

This release packages the existing FLOWLY frontend + Node/Express API + PostgreSQL for a repeatable Docker deployment. The approved visual design is unchanged.

## Architecture
- `web`: a dedicated Nginx image containing only FLOWLY HTML/assets; `/api/*` is reverse-proxied to the API.
- `api`: Node.js 20 + Express application from `backend/`.
- `db`: PostgreSQL 16 with a named persistent volume; port 5432 is not published publicly.
- Browser API routing uses same-origin `/api/v1` over HTTP/HTTPS; `file://` demos keep the localhost API fallback.

## First production deployment
1. Install Docker Engine/Desktop with Compose v2.
2. Copy `.env.production.example` to `.env.production`.
3. Replace every `REPLACE_*` value. Use a long URL-safe PostgreSQL password, and use the same password in `POSTGRES_PASSWORD` and `DATABASE_URL`.
4. Set `APP_ORIGIN` and `FRONTEND_ORIGIN` to the exact public **HTTPS** origin.
5. Put the host behind an HTTPS reverse proxy/load balancer (for example your cloud ingress, Caddy, Traefik, or Nginx TLS proxy).
6. Run `deploy/start-production.ps1` on Windows PowerShell or `./deploy/start-production.sh` on Linux/macOS.
7. Confirm `docker compose ps` reports `db`, `api`, and `web` healthy.

## Migrations
`npm run migrate` applies migration files in filename order and records applied files in `schema_migrations`, so already-applied migrations are skipped. Run a verified backup before each production migration.

## Health checks
- Web: `/healthz`
- API: `/api/v1/health`
- PostgreSQL: `pg_isready`

## Security/deployment notes
- `.env.production` is deliberately excluded from the frontend Docker build and must never be committed.
- PostgreSQL is reachable only on the internal Compose network by default.
- The API's production guard requires HTTPS `FRONTEND_ORIGIN`, database authentication mode, a database URL, and a JWT secret of at least 32 characters.
- The bundled Compose database is appropriate for an initial single-host rollout. A managed PostgreSQL service can replace it later by changing `DATABASE_URL` and deployment topology.
