FLOWLY V2.36 — Production Smoke Test

Base: V2.35 First Live Deployment
Visual baseline: unchanged

Added:
- backend/scripts/production-e2e-smoke.js
- backend/scripts/check-production-smoke.js
- deploy/production-smoke-test.ps1
- deploy/production-smoke-test.sh
- PRODUCTION_SMOKE_TEST_V236.md
- npm scripts: smoke:e2e, check:smoke

Two-stage testing:
SAFE = health + DB + auth + role boundary + logout, no workflow records.
FULL = opt-in real workflow through PostgreSQL and AI, intended only for a dedicated smoke-test business.
