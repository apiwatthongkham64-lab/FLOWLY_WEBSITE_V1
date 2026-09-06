FLOWLY V2.26 — PostgreSQL Database Design

Base: V2.25 Backend Foundation
Visual/frontend pages are preserved.

Added:
- backend/migrations/001_flowly_core_schema.sql
- backend/migrations/002_flowly_indexes_and_updated_at.sql
- backend/migrations/003_flowly_tenant_guardrails.sql
- backend/docs/DATABASE_DESIGN_V226.md
- backend/scripts/check-db-design.js
- npm script: npm run check:db

Scope locked for this step:
Users → Businesses → Roles → Departments → Customers → Leads → Service Requests → Bookings → Projects → Tasks → Activity → Customer Memory → AI Insights → Automation Rules.

No API/database wiring yet. That is the next step after schema approval.
