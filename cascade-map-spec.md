# Cascade Map — build spec
(working name — avoid "blast radius", it's taken by a well-known Terraform tool)

A tool that auto-discovers Postgres foreign-key relationships, renders the full schema as a graph, then SIMULATES deleting a row and animates the cascade rippling outward in real time — showing exactly what data dies before anyone actually deletes it.

Note: plain schema/ER diagram tools already exist (ChartDB, dbdiagram.io, DrawSQL, Azimutt). Don't compete on that. The schema graph is just the backdrop. Three things make this stand out: (1) the live delete-cascade animation, (2) the tenant isolation leak detector — flags tables a query could accidentally leak across tenants, (3) the safe delete script generator — outputs real usable SQL after the simulation. Nothing else like this combination exists.

## Stack
- Backend: Node.js + NestJS (TypeScript) + `pg`
- DB: PostgreSQL (Railway or Supabase free tier)
- Frontend: React + TypeScript + `react-flow` (graph rendering) + Tailwind
- Deploy: Backend on Render/Railway, Frontend on Vercel, DB on Railway/Supabase
- Repo: public on GitHub (`v1shalx/cascade-map`)

## Demo schema (seed this first)
A fake multi-tenant SaaS schema, 6 tables, real FK constraints:

```
tenants (id, name, created_at)
users (id, tenant_id -> tenants.id, name, email)
orders (id, user_id -> users.id, tenant_id -> tenants.id, total, status)
payments (id, order_id -> orders.id, amount, status)
reviews (id, user_id -> users.id, order_id -> orders.id, rating)
support_tickets (id, user_id -> users.id, tenant_id -> tenants.id, subject)
```
Seed ~3 tenants, 10-15 users, 30-40 orders, with payments/reviews/tickets attached, so the graph looks substantial when traversed.

## Build order

### 1. FK auto-discovery (backend)
Goal: list every FK relationship in the DB with zero manual config.

- Query `information_schema.table_constraints` joined with `key_column_usage` and `constraint_column_usage` to extract: `(child_table, child_column, parent_table, parent_column)` for every FK in the DB
- Output as a clean adjacency list, e.g.:
```json
[
  { "from": "users", "fromCol": "tenant_id", "to": "tenants", "toCol": "id" },
  { "from": "orders", "fromCol": "tenant_id", "to": "tenants", "toCol": "id" },
  { "from": "orders", "fromCol": "user_id", "to": "users", "toCol": "id" }
]
```

### 2. Full schema endpoint (backend)
Goal: give the frontend everything needed to draw the static graph (the backdrop).
```
GET /schema
```
Response: all tables, their columns, and the FK adjacency list from step 1. This powers the initial "here's the whole database" view before any simulation runs.

### 3. Cascade traversal + simulation endpoint (backend — this is the core feature)
Goal: given a starting row, recursively find every dependent row, AND return it in an order that supports step-by-step animation (BFS layer by layer, not just a flat list).

- Build a graph in memory from the FK list (which tables point TO which)
- Function: `simulateCascade(table, id)` — BFS outward from the target row, one "wave" per FK hop. Each wave = the set of rows discovered at that depth.
- Cap traversal: max depth 5, max 500 rows per table (`truncated: true` if exceeded)
- Endpoint:
```
GET /cascade?table=tenants&id=3
```
Response — note the `waves` array, this is what drives the animation:
```json
{
  "root": { "table": "tenants", "id": 3 },
  "waves": [
    { "depth": 1, "table": "users", "ids": [12,13,14] },
    { "depth": 2, "table": "orders", "ids": [55,56,57,58] },
    { "depth": 3, "table": "payments", "ids": [101,102] }
  ],
  "totalAffected": 9
}
```

### 6. Tenant isolation leak detector (standout feature #1)
Goal: auto-flag any table in the schema that's reachable WITHOUT passing through a `tenant_id`-style column anywhere in its FK chain — a real, common multi-tenant data-leak bug class.

- Walk the FK graph from each root tenant-scoped table
- For every table, check if at least one column in its chain back to `tenants` is itself a tenant-scoping column (e.g. `tenant_id`, or inherits one via a parent that has it)
- Flag tables where this isn't true as `⚠ unscoped — possible cross-tenant leak`
- Endpoint:
```
GET /isolation-check
```
Response:
```json
{
  "safe": ["users", "orders", "payments"],
  "flagged": [
    { "table": "support_tickets", "reason": "reachable without a tenant_id column in the chain" }
  ]
}
```
- Frontend: a separate toggle/view on the schema graph — flagged tables render with a warning border + tooltip explaining the risk

### 7. Safe delete script generator (standout feature #2)
Goal: turn the cascade simulation from "just a visualization" into something with a real, usable output.

- After running a cascade simulation, add a "Generate safe delete SQL" button
- Backend takes the `waves` array from the `/cascade` response and reverses it (children-deepest first) to produce valid `DELETE` statements in correct dependency order, OR a soft-delete variant (`UPDATE ... SET deleted_at = now()`)
- Endpoint:
```
GET /cascade/script?table=tenants&id=3&mode=soft|hard
```
Response: plain SQL text, shown in a copyable code block on the frontend with a "Copy" button

### 8. Frontend — static schema graph
- React app, single page, `react-flow`
- Render all tables as nodes (from `/schema`), FK relationships as edges — this is the "wow, the whole DB" first impression
- Clean layout (auto-arrange with `dagre` or `elkjs` so it doesn't look like spaghetti)

### 9. Frontend — the cascade animation (spend the most effort here)
- A selector (dropdown or preset buttons) to pick a row to "delete"
- On trigger, call `/cascade`, then animate the response **wave by wave**, not all at once:
  - Wave 1 nodes turn red with a brief pulse/glow, ~400-600ms
  - Edges leading to wave 1 animate as a traveling pulse along the line
  - Short pause, then wave 2 lights up, then wave 3, etc.
  - A live counter ticks up in sync with each wave: "12 rows... 47 rows... 89 rows affected"
- End state: clear visual split — red = will be deleted, gray/dimmed = untouched, with a final summary bar ("This deletes 89 rows across 5 tables")
- Click any red node → small popup with that row's actual data (name/email/amount), pulled from a lightweight `/row-details?table=&id=` endpoint
- A "reset" button to clear the simulation and try another row

### 10. Polish + deploy
- 2-3 preset "Try it" buttons (e.g. "Delete Tenant: Acme Corp") so visitors don't need to guess valid IDs
- Loading skeleton while the schema graph first loads
- README: problem statement, screenshot/GIF of the animation (this matters a lot — a GIF sells this project more than text), how FK auto-discovery works, how to run locally, roadmap section (see below)
- Deploy:
  1. Push seeded DB to Railway/Supabase Postgres
  2. Deploy NestJS backend to Render/Railway, set `DATABASE_URL` env var
  3. Deploy React frontend to Vercel, set API base URL env var
  4. Test the live link end-to-end, specifically the animation timing — it must feel smooth, not janky
- Add to portfolio as project card: status `LIVE_DEMO`, tags `NestJS · PostgreSQL · React · Systems Design`

## Roadmap section for README (signals senior thinking, don't need to build it)
- Read-only DB credentials enforcement for production use
- Soft-FK config file for app-level relationships without real FK constraints
- CLI mode: `npx blast-radius check --table=tenants --id=42`
- Export blast-radius report as JSON/PDF for change-review approvals

## What "done" looks like
- Public GitHub repo with clean README + screenshot/GIF
- Live deployed link, loads in under 2s, works on first click with zero setup
- Portfolio project card linking both
