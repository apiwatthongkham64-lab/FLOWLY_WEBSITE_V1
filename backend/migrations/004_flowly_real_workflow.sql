BEGIN;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS service_request_id uuid REFERENCES service_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tasks_business_due_idx
  ON tasks (business_id, due_at) WHERE status IN ('todo','in_progress','blocked');
CREATE INDEX IF NOT EXISTS tasks_service_request_idx
  ON tasks (business_id, service_request_id) WHERE service_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS bookings_business_starts_idx
  ON bookings (business_id, starts_at);
CREATE INDEX IF NOT EXISTS activity_log_business_created_idx
  ON activity_log (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS service_requests_business_status_idx
  ON service_requests (business_id, status, created_at DESC);

COMMIT;
