FLOWLY V2.25 — BACKEND FOUNDATION

Base: V2.24 Intelligence Layer
Visual policy: no visual redesign in this phase.

ADDED
- backend/ Node.js + Express foundation
- versioned /api/v1 router
- centralized environment config
- PostgreSQL connection adapter (schema intentionally not created yet)
- JWT cookie/Bearer authentication foundation
- Owner/Admin role middleware
- request ID, error handling, 404 handling, Helmet, CORS
- health/auth/business/intelligence foundation routes
- frontend assets/js/api-client.js adapter for later integration
- backend README and validation script

IMPORTANT
This phase does not connect existing frontend forms to the API yet and does not create the database schema. Those are later roadmap steps, preserving the agreed order: Backend Foundation -> Database Design -> Frontend/API integration.
