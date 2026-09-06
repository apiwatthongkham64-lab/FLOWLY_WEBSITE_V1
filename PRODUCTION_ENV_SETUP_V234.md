# FLOWLY V2.34 — Production Environment Setup

This release prepares the production environment without inventing a real domain or storing production secrets in the ZIP.

## Recommended first-run sequence

### Windows PowerShell
```powershell
cd backend
npm run prod:env:generate -- --domain=YOUR-DOMAIN.COM
npm run prod:env:check
cd ..
```

### Linux / macOS
```bash
cd backend
npm run prod:env:generate -- --domain=YOUR-DOMAIN.COM
npm run prod:env:check
cd ..
```

The generator creates `/.env.production` with:
- secure random PostgreSQL password
- secure random JWT secret
- HTTPS application/frontend origin
- database/auth mode locked for production
- backup and rate-limit defaults

It refuses to overwrite an existing `.env.production` unless `--force` is explicitly provided.

## Required before deployment
1. Use the real domain in the generator command.
2. Confirm DNS points to the production server.
3. Confirm ports 80/443 are available to the reverse proxy or hosting layer.
4. Run `npm run prod:env:check` and require 15/15 PASS.
5. Keep `.env.production` out of source control and backups shared with third parties.
6. For a managed PostgreSQL provider, replace `DATABASE_URL` and set `DB_SSL=true` when required by that provider.
7. Do not run the V2.32 launch script until the environment check passes.

## Important
V2.34 does not deploy the application and does not contain real credentials. It prepares a safe production configuration workflow for the next stage, V2.35 First Live Deployment.
