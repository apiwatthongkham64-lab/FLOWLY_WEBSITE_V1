# FLOWLY V2.29 — Real Workflow Modules

This pass turns the existing CRM/request foundation into an operational workflow without changing the 7-department showroom visual layer.

## Core flow

Customer Front Request -> Customer -> Lead -> Service Request -> Booking (optional) -> Follow-up Task -> Activity Timeline

## API

- `GET /api/v1/bookings`
- `POST /api/v1/bookings`
- `PATCH /api/v1/bookings/:id`
- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `PATCH /api/v1/tasks/:id`
- `GET /api/v1/activity`
- `POST /api/v1/workflows/requests/:id/confirm`
- `POST /api/v1/workflows/leads/:id/follow-up`

All protected endpoints are scoped by the authenticated `businessId`.

## Workflow rules

1. A Customer Front request creates or reuses a Customer.
2. It also creates a linked Lead and Service Request in one transaction.
3. Confirming a Service Request can create a confirmed Booking and always creates a follow-up Task.
4. Scheduling a Lead follow-up updates `next_follow_up_at`, advances a new lead to `contacted`, creates a Task, and writes Activity Log.
5. Every workflow mutation records an Activity Log entry.

No payment integration or autonomous external messaging is enabled in this pass.
