# FLOWLY V2.30 — AI Integration with Real Business Data

The Intelligence Layer now reads tenant-scoped PostgreSQL data from Leads, Service Requests, Tasks, Bookings, Activity and Customer Memory. It produces explainable operational scores and Next Best Actions, persists them to `ai_insights`, and keeps automation in preview-only mode requiring approval.

## API
- `GET /api/v1/intelligence/overview?department=professional&refresh=true`
- `GET /api/v1/intelligence/insights?department=professional&status=open`
- `POST /api/v1/intelligence/generate` body `{ "department": "professional" }`
- `PATCH /api/v1/intelligence/insights/:id/status` body `{ "status": "accepted" }`

Department aliases accepted: `spa`, `beauty`, `clinic`, `hotel`, `restaurant`, `construction`, `professional`.

## Guardrails
- All reads/writes are scoped by authenticated `businessId`.
- Clinic intelligence is operational only; it does not diagnose or provide medical advice.
- Automation is suggestion/preview only and requires human approval.
- Evidence is stored with each insight so recommendations remain inspectable.
