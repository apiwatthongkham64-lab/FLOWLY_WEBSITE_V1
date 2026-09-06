BEGIN;

CREATE TABLE IF NOT EXISTS security_audit_log (
  id bigserial PRIMARY KEY,
  business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  request_id text,
  event_type text NOT NULL,
  success boolean NOT NULL DEFAULT true,
  ip_address inet,
  user_agent text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT security_audit_event_not_blank CHECK (btrim(event_type) <> '')
);

CREATE INDEX IF NOT EXISTS security_audit_business_created_idx
  ON security_audit_log (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS security_audit_actor_created_idx
  ON security_audit_log (actor_user_id, created_at DESC)
  WHERE actor_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS security_audit_event_created_idx
  ON security_audit_log (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS security_audit_request_idx
  ON security_audit_log (request_id)
  WHERE request_id IS NOT NULL;

COMMENT ON TABLE security_audit_log IS 'Append-only security event trail. Never store passwords, tokens, cookies, or secrets in details.';

COMMIT;
