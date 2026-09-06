BEGIN;

ALTER TABLE ai_insights
  ADD COLUMN IF NOT EXISTS source_key text,
  ADD COLUMN IF NOT EXISTS generated_by text NOT NULL DEFAULT 'flowly_rules_v1';

CREATE INDEX IF NOT EXISTS ai_insights_business_status_priority_idx
  ON ai_insights (business_id, status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_insights_business_department_idx
  ON ai_insights (business_id, department_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ai_insights_open_source_key_uq
  ON ai_insights (business_id, source_key)
  WHERE source_key IS NOT NULL AND status = 'open';

CREATE INDEX IF NOT EXISTS customer_memory_business_customer_active_idx
  ON customer_memory (business_id, customer_id, is_active, updated_at DESC);

COMMIT;
