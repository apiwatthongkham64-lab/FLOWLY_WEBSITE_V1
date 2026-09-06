# FLOWLY V2.33 — Final Release Checklist

## Passed in package QA
- 28 top-level HTML pages available.
- 7 Customer Front demos and 7 Business Admin showroom demos available.
- Local file links and HTML anchors resolve.
- Backend JavaScript syntax passes Node syntax checks.
- Six ordered PostgreSQL migrations are present.
- Auth/Roles, workflow, AI real-data, security and deployment structural checks pass.
- Production stack keeps PostgreSQL private and routes `/api/v1` through the web tier.
- Secrets are not bundled into the public web image by design.

## Required before public launch
1. Copy `.env.production.example` to the server secret environment and set real secrets.
2. Set the final HTTPS domain in `FRONTEND_ORIGIN`.
3. Build Docker images on the deployment host.
4. Start PostgreSQL and run all migrations.
5. Create the initial Owner account/business with production credentials.
6. Smoke-test login, Customer Front request, Admin workflow, AI insight generation and logout.
7. Verify HTTPS certificate, DNS and reverse proxy headers.
8. Run a real database backup and verify checksum.
9. Test restore on a disposable/staging database, never directly on production.
10. Review logs and audit events after the smoke test.

Do not call the system production-live until the live environment checks above pass.
