# FLOWLY V2.36 — Production Smoke Test

V2.36 adds a repeatable End-to-End smoke test for the deployed FLOWLY stack without changing the approved frontend/visual baseline.

## Test levels

### SAFE mode — run first
SAFE mode does not create workflow data. It checks:
1. Nginx `/healthz`
2. API `/api/v1/health`
3. PostgreSQL `configured=true` and `connected=true`
4. Homepage response
5. Owner login
6. Owner `/auth/me`
7. Business profile read
8. Admin login
9. Staff login
10. Permission boundary: Staff customer creation must return `403 FORBIDDEN`
11. Owner logout
12. Unauthenticated `/auth/me` must return 401

### FULL mode — dedicated smoke-test business only
Set `SMOKE_WRITE=true` only when the selected business is safe for test records. It additionally validates the real workflow:

`Customer Front Request → Customer → Lead → Service Request → Booking → Follow-up Task → Activity → AI Insight → Next Best Action`

FULL mode creates uniquely tagged records. It does not delete production records automatically.

## Windows / PowerShell

From the project root after V2.35 deployment is running:

```powershell
$env:SMOKE_OWNER_EMAIL="owner@flowly.local"
$env:SMOKE_OWNER_PASSWORD="<your smoke-test password>"
$env:SMOKE_ADMIN_EMAIL="admin@flowly.local"
$env:SMOKE_ADMIN_PASSWORD="<your smoke-test password>"
$env:SMOKE_STAFF_EMAIL="staff@flowly.local"
$env:SMOKE_STAFF_PASSWORD="<your smoke-test password>"
.\deploy\production-smoke-test.ps1
```

For FULL mode, only against the dedicated test business:

```powershell
$env:SMOKE_BUSINESS_SLUG="flowly-demo"
$env:SMOKE_WRITE="true"
.\deploy\production-smoke-test.ps1
```

To return to SAFE mode:

```powershell
Remove-Item Env:SMOKE_WRITE -ErrorAction SilentlyContinue
```

## Linux / macOS

```bash
SMOKE_OWNER_EMAIL=owner@flowly.local \
SMOKE_OWNER_PASSWORD='<password>' \
SMOKE_ADMIN_EMAIL=admin@flowly.local \
SMOKE_ADMIN_PASSWORD='<password>' \
SMOKE_STAFF_EMAIL=staff@flowly.local \
SMOKE_STAFF_PASSWORD='<password>' \
./deploy/production-smoke-test.sh
```

## Remote HTTPS domain

The test can target the public domain instead of localhost:

```powershell
$env:SMOKE_BASE_URL="https://your-domain.example"
$env:SMOKE_ORIGIN="https://your-domain.example"
.\deploy\production-smoke-test.ps1
```

`SMOKE_ORIGIN` should match `FRONTEND_ORIGIN` for cookie-authenticated write tests.

## Before FULL mode

- V2.35 deployment is healthy.
- All migrations have completed.
- A dedicated FLOWLY smoke-test business exists.
- Owner/Admin/Staff accounts belong to that same business.
- Credentials are passed through environment variables, never committed to source.
- Do not run FULL mode against a real customer's active production business.

## Pass criteria

SAFE mode: all executed checks pass with zero failures.

FULL mode: SAFE checks plus public request, workflow, activity and AI checks all pass with zero failures.
