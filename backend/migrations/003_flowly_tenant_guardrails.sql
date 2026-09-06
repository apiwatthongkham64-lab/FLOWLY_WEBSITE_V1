BEGIN;

-- Tenant-safe composite uniqueness helpers. API/service layer must always scope reads/writes by business_id.
CREATE UNIQUE INDEX IF NOT EXISTS customers_business_external_ref_uq
  ON customers (business_id, external_ref)
  WHERE external_ref IS NOT NULL;

-- Prevent duplicate active memory rows for the same explicit memory key.
CREATE UNIQUE INDEX IF NOT EXISTS customer_memory_active_key_uq
  ON customer_memory (business_id, customer_id, memory_type, memory_key)
  WHERE is_active = true AND memory_key IS NOT NULL;

-- Foundation for PostgreSQL Row-Level Security. Policies are intentionally not enabled yet;
-- they should be activated only when authenticated DB session context is implemented.
COMMENT ON TABLE businesses IS 'Tenant root. All operational data must be scoped by business_id.';
COMMENT ON COLUMN business_members.role IS 'Application roles: owner, admin, staff.';
COMMENT ON TABLE activity_log IS 'Append-oriented audit/activity stream. Do not use as the sole source of truth.';
COMMENT ON TABLE ai_insights IS 'AI output/decision-support only; evidence and status are retained for traceability.';
COMMENT ON TABLE automation_rules IS 'Automation is disabled by default and requires approval by default.';

COMMIT;
