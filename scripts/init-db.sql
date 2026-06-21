-- =============================================================================
-- cascade-map: schema + read-only role setup
-- Run once against cascade_map database (admin/superuser required)
-- docker-compose mounts this as the first init script
-- =============================================================================

-- ── Read-only role ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cascade_readonly') THEN
    CREATE ROLE cascade_readonly WITH LOGIN PASSWORD 'readonly_secret' NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;

-- Grant connect + usage but NOT write privileges
GRANT CONNECT ON DATABASE cascade_map TO cascade_readonly;
GRANT USAGE ON SCHEMA public TO cascade_readonly;

-- Tables will be created in seed.sql; grant SELECT after creation
-- (see end of seed.sql)

-- ── Schema ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenants (
  id         SERIAL PRIMARY KEY,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER     NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE IF NOT EXISTS orders (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  tenant_id  INTEGER        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  total      NUMERIC(10, 2) NOT NULL,
  status     TEXT           NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount     NUMERIC(10, 2) NOT NULL,
  status     TEXT           NOT NULL DEFAULT 'pending',
  paid_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject    TEXT    NOT NULL,
  status     TEXT    NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
