-- =============================================================================
-- cascade-map: seed data
-- 3 tenants, 15 users, 36 orders, payments, reviews, support tickets
-- Designed so a cascade delete of any tenant wipes a meaningful chunk of data
-- =============================================================================

TRUNCATE TABLE support_tickets, reviews, payments, orders, users, tenants
  RESTART IDENTITY CASCADE;

-- ── Tenants ───────────────────────────────────────────────────────────────────
INSERT INTO tenants (name) VALUES
  ('Acme Corp'),
  ('Globex Industries'),
  ('Initech Solutions');

-- ── Users ─────────────────────────────────────────────────────────────────────
-- tenant 1: Acme Corp (users 1-5)
INSERT INTO users (tenant_id, name, email) VALUES
  (1, 'Alice Nguyen',    'alice@acme.com'),
  (1, 'Bob Patel',       'bob@acme.com'),
  (1, 'Carol Kim',       'carol@acme.com'),
  (1, 'David Okonkwo',   'david@acme.com'),
  (1, 'Eve Ramirez',     'eve@acme.com');

-- tenant 2: Globex (users 6-10)
INSERT INTO users (tenant_id, name, email) VALUES
  (2, 'Frank Burns',     'frank@globex.com'),
  (2, 'Grace Hopper',    'grace@globex.com'),
  (2, 'Hank Scorpio',    'hank@globex.com'),
  (2, 'Iris Chen',       'iris@globex.com'),
  (2, 'Jack Donaghy',    'jack@globex.com');

-- tenant 3: Initech (users 11-15)
INSERT INTO users (tenant_id, name, email) VALUES
  (3, 'Karen Page',      'karen@initech.com'),
  (3, 'Liam Neeson',     'liam@initech.com'),
  (3, 'Maria Santos',    'maria@initech.com'),
  (3, 'Noah Fisher',     'noah@initech.com'),
  (3, 'Olivia Morales',  'olivia@initech.com');

-- ── Orders ────────────────────────────────────────────────────────────────────
-- 12 orders for Acme (tenant 1)
INSERT INTO orders (user_id, tenant_id, total, status) VALUES
  (1, 1, 149.99, 'completed'),
  (1, 1, 89.00,  'completed'),
  (2, 1, 210.50, 'completed'),
  (2, 1, 55.00,  'pending'),
  (3, 1, 399.99, 'completed'),
  (3, 1, 12.99,  'cancelled'),
  (4, 1, 75.00,  'completed'),
  (4, 1, 320.00, 'completed'),
  (5, 1, 99.00,  'pending'),
  (5, 1, 145.50, 'completed'),
  (1, 1, 18.00,  'completed'),
  (2, 1, 500.00, 'completed');

-- 12 orders for Globex (tenant 2)
INSERT INTO orders (user_id, tenant_id, total, status) VALUES
  (6,  2, 250.00, 'completed'),
  (6,  2, 40.00,  'pending'),
  (7,  2, 130.00, 'completed'),
  (7,  2, 960.00, 'completed'),
  (8,  2, 75.00,  'cancelled'),
  (8,  2, 200.00, 'completed'),
  (9,  2, 88.99,  'completed'),
  (9,  2, 305.00, 'pending'),
  (10, 2, 50.00,  'completed'),
  (10, 2, 199.99, 'completed'),
  (6,  2, 65.00,  'completed'),
  (7,  2, 450.00, 'completed');

-- 12 orders for Initech (tenant 3)
INSERT INTO orders (user_id, tenant_id, total, status) VALUES
  (11, 3, 120.00, 'completed'),
  (11, 3, 34.00,  'pending'),
  (12, 3, 780.00, 'completed'),
  (12, 3, 55.50,  'cancelled'),
  (13, 3, 299.00, 'completed'),
  (13, 3, 180.00, 'completed'),
  (14, 3, 66.00,  'pending'),
  (14, 3, 900.00, 'completed'),
  (15, 3, 42.00,  'completed'),
  (15, 3, 210.00, 'completed'),
  (11, 3, 330.00, 'completed'),
  (12, 3, 75.00,  'completed');

-- ── Payments ──────────────────────────────────────────────────────────────────
-- Only completed orders get a payment record
INSERT INTO payments (order_id, amount, status, paid_at)
SELECT id, total, 'settled', now() - (random() * interval '30 days')
FROM orders
WHERE status = 'completed';

-- ── Reviews ───────────────────────────────────────────────────────────────────
INSERT INTO reviews (user_id, order_id, rating, body)
SELECT
  o.user_id,
  o.id,
  (floor(random() * 4) + 2)::smallint,  -- ratings 2-5, no 1-star disasters
  CASE floor(random() * 3)::int
    WHEN 0 THEN 'Great product, fast delivery!'
    WHEN 1 THEN 'Exactly as described. Would order again.'
    ELSE        'Good value for money.'
  END
FROM orders o
WHERE o.status = 'completed'
  AND random() > 0.4;  -- ~60% of completed orders get a review

-- ── Support tickets ───────────────────────────────────────────────────────────
INSERT INTO support_tickets (user_id, tenant_id, subject, status) VALUES
  (1, 1, 'Wrong item shipped',              'open'),
  (2, 1, 'Need invoice for order #3',       'resolved'),
  (3, 1, 'Discount code not applying',      'open'),
  (6, 2, 'Account access issue',            'open'),
  (7, 2, 'Refund request for order #15',    'pending'),
  (8, 2, 'Shipping delay — order #19',      'resolved'),
  (11, 3, 'Subscription upgrade question',  'open'),
  (12, 3, 'Duplicate charge on order #27',  'open'),
  (13, 3, 'Password reset not working',     'resolved');

-- ── Grant SELECT to read-only role ────────────────────────────────────────────
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cascade_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO cascade_readonly;
