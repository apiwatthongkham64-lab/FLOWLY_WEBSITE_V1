BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Shared enum-like lookup strategy: use CHECK constraints instead of PostgreSQL ENUMs
-- so future departments/workflows can evolve without destructive enum migrations.

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text,
  display_name text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','suspended','deleted')),
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_not_blank CHECK (btrim(email) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uq ON users (lower(email));

CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  business_type text,
  timezone text NOT NULL DEFAULT 'Asia/Bangkok',
  locale text NOT NULL DEFAULT 'th-TH',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','trial','suspended','closed')),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT businesses_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT businesses_slug_not_blank CHECK (btrim(slug) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS businesses_slug_lower_uq ON businesses (lower(slug));

CREATE TABLE IF NOT EXISTS business_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('owner','admin','staff')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','disabled')),
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  joined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);

CREATE TABLE IF NOT EXISTS departments (
  id smallserial PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order smallint NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  department_id smallint NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  is_enabled boolean NOT NULL DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, department_id)
);

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  external_ref text,
  full_name text NOT NULL,
  email text,
  phone text,
  preferred_channel text CHECK (preferred_channel IN ('phone','email','line','facebook','whatsapp','other')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','blocked')),
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_contact_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customers_name_not_blank CHECK (btrim(full_name) <> '')
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  department_id smallint REFERENCES departments(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual',
  title text NOT NULL,
  description text,
  stage text NOT NULL DEFAULT 'new' CHECK (stage IN ('new','contacted','qualified','proposal','won','lost')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  score numeric(5,2) CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  next_follow_up_at timestamptz,
  won_at timestamptz,
  lost_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leads_title_not_blank CHECK (btrim(title) <> '')
);

CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  department_id smallint REFERENCES departments(id) ON DELETE SET NULL,
  request_type text NOT NULL,
  reference_no text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','confirmed','in_progress','completed','cancelled')),
  requested_for timestamptz,
  summary text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'customer_front',
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, reference_no)
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  service_request_id uuid REFERENCES service_requests(id) ON DELETE SET NULL,
  department_id smallint REFERENCES departments(id) ON DELETE SET NULL,
  booking_type text NOT NULL DEFAULT 'appointment',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','checked_in','completed','cancelled','no_show')),
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_time_order CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  service_request_id uuid REFERENCES service_requests(id) ON DELETE SET NULL,
  department_id smallint REFERENCES departments(id) ON DELETE SET NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','on_hold','completed','cancelled')),
  owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  start_date date,
  due_date date,
  completed_at timestamptz,
  budget numeric(14,2) CHECK (budget IS NULL OR budget >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT projects_date_order CHECK (due_date IS NULL OR start_date IS NULL OR due_date >= start_date)
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','blocked','done','cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tasks_title_not_blank CHECK (btrim(title) <> '')
);

CREATE TABLE IF NOT EXISTS activity_log (
  id bigserial PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  summary text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  memory_type text NOT NULL,
  memory_key text,
  content text NOT NULL,
  source_entity_type text,
  source_entity_id uuid,
  confidence numeric(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  department_id smallint REFERENCES departments(id) ON DELETE SET NULL,
  insight_type text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  score numeric(5,2) CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  recommendation text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','accepted','dismissed','completed','expired')),
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_insights_title_not_blank CHECK (btrim(title) <> '')
);

CREATE TABLE IF NOT EXISTS automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  trigger_type text NOT NULL,
  action_type text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_enabled boolean NOT NULL DEFAULT false,
  requires_approval boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT automation_rules_name_not_blank CHECK (btrim(name) <> '')
);

INSERT INTO departments (code, name, sort_order)
VALUES
  ('spa_wellness', 'Spa & Wellness', 1),
  ('beauty_salon', 'Beauty & Salon', 2),
  ('clinic_healthcare', 'Clinic & Healthcare', 3),
  ('hotel_hospitality', 'Hotel & Hospitality', 4),
  ('food_restaurant', 'Food & Restaurant', 5),
  ('construction_services', 'Construction & Services', 6),
  ('professional_business', 'Professional Business', 7)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order,
    is_active = true;

COMMIT;
