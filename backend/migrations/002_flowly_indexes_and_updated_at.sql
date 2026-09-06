BEGIN;

CREATE OR REPLACE FUNCTION flowly_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users','businesses','business_members','business_departments','customers','leads',
    'service_requests','bookings','projects','tasks','customer_memory','ai_insights','automation_rules'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', 'trg_' || tbl || '_updated_at', tbl);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION flowly_set_updated_at()',
      'trg_' || tbl || '_updated_at', tbl
    );
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS business_members_business_idx ON business_members (business_id, status);
CREATE INDEX IF NOT EXISTS business_members_user_idx ON business_members (user_id, status);
CREATE INDEX IF NOT EXISTS business_departments_business_idx ON business_departments (business_id, is_enabled);

CREATE INDEX IF NOT EXISTS customers_business_created_idx ON customers (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS customers_business_phone_idx ON customers (business_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS customers_business_email_lower_idx ON customers (business_id, lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS customers_tags_gin_idx ON customers USING gin (tags);

CREATE INDEX IF NOT EXISTS leads_business_stage_idx ON leads (business_id, stage, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_business_followup_idx ON leads (business_id, next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS leads_customer_idx ON leads (customer_id);

CREATE INDEX IF NOT EXISTS service_requests_business_status_idx ON service_requests (business_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS service_requests_customer_idx ON service_requests (customer_id);
CREATE INDEX IF NOT EXISTS service_requests_department_idx ON service_requests (business_id, department_id, created_at DESC);

CREATE INDEX IF NOT EXISTS bookings_business_start_idx ON bookings (business_id, starts_at);
CREATE INDEX IF NOT EXISTS bookings_business_status_idx ON bookings (business_id, status, starts_at);
CREATE INDEX IF NOT EXISTS bookings_customer_idx ON bookings (customer_id);

CREATE INDEX IF NOT EXISTS projects_business_status_idx ON projects (business_id, status, due_date);
CREATE INDEX IF NOT EXISTS projects_customer_idx ON projects (customer_id);
CREATE INDEX IF NOT EXISTS tasks_business_status_due_idx ON tasks (business_id, status, due_at);
CREATE INDEX IF NOT EXISTS tasks_assignee_due_idx ON tasks (assigned_to, status, due_at) WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS activity_business_created_idx ON activity_log (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_entity_idx ON activity_log (business_id, entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_customer_idx ON activity_log (customer_id, created_at DESC) WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS customer_memory_customer_idx ON customer_memory (business_id, customer_id, is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS ai_insights_business_status_idx ON ai_insights (business_id, status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_insights_customer_idx ON ai_insights (customer_id, created_at DESC) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS automation_rules_business_enabled_idx ON automation_rules (business_id, is_enabled);

COMMIT;
