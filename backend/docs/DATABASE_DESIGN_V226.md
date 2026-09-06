# FLOWLY V2.26 — PostgreSQL Database Design

## Design principles

1. **Multi-business first:** `businesses` is the tenant root. Operational tables carry `business_id`.
2. **Seven departments, one platform:** department-specific differences live in `department_id`, `request_type`, and `jsonb` metadata instead of seven duplicated schemas.
3. **Customer memory is explicit:** `customer_memory` stores durable business context separately from raw activity.
4. **AI is traceable:** `ai_insights` stores evidence, recommendation, score, priority, and lifecycle status.
5. **Automation starts safe:** `automation_rules.is_enabled = false` and `requires_approval = true` by default.
6. **No payment/accounting scope yet:** the schema intentionally stops before payment processing, payroll, inventory, or full accounting.

## Core relationship map

`users` ⇄ `business_members` ⇄ `businesses`

`businesses` → `business_departments` → `departments`

`businesses` → `customers` → `leads` → `service_requests` → `bookings`

`businesses` → `projects` → `tasks`

`customers / leads / requests / projects` → `activity_log`

`customers` → `customer_memory`

`businesses / customers / departments` → `ai_insights`

`businesses` → `automation_rules`

## Table responsibilities

- `users`: login identity/profile.
- `businesses`: tenant/business workspace.
- `business_members`: Owner/Admin/Staff membership.
- `departments`: canonical seven FLOWLY departments.
- `business_departments`: which department capabilities a business uses.
- `customers`: CRM customer/client master.
- `leads`: sales/opportunity pipeline.
- `service_requests`: universal Customer Front intake record (booking request, consultation, quote request, project brief, etc.).
- `bookings`: time-based appointments/reservations/schedules.
- `projects`: longer-running engagements/jobs/cases/projects.
- `tasks`: operational work and follow-up.
- `activity_log`: chronological activity/audit feed.
- `customer_memory`: curated durable customer context for Smart Customer Memory.
- `ai_insights`: Remember → Analyze → Recommend outputs.
- `automation_rules`: future Smart Automation configuration; safe/off by default.

## Department strategy

Do **not** create seven separate customer/lead/task tables. The common workflow remains shared; department-specific fields are stored in `details` / `metadata` JSONB until a field becomes important enough to deserve a normalized table.

Examples:
- Spa: treatment/service preference in `service_requests.details`.
- Hotel: room/guest request details in `service_requests.details`, reservation time in `bookings`.
- Restaurant: table/party details in `service_requests.details`, reservation time in `bookings`.
- Construction: site/project brief in `service_requests.details`, accepted work becomes `projects`.
- Professional: consultation/proposal brief in `service_requests.details`, engagement becomes `projects`.

## Migration order

1. `001_flowly_core_schema.sql` — tables + seven department seed rows.
2. `002_flowly_indexes_and_updated_at.sql` — timestamps + performance indexes.
3. `003_flowly_tenant_guardrails.sql` — tenant uniqueness + safety comments/future RLS foundation.

## Next backend connection order

After this schema is approved, connect APIs in this order:

1. Auth + business membership
2. Business profile + department configuration
3. Customer CRM
4. Leads
5. Customer Front `service_requests`
6. Bookings
7. Projects + tasks
8. Activity log
9. Customer memory + AI insights
10. Automation rules (preview first; execution later)

## Deliberately deferred

- PostgreSQL RLS activation (wait until authenticated DB session context is designed)
- payments / subscriptions
- accounting / payroll
- inventory / POS
- document storage blobs
- external messaging execution
- autonomous AI actions
