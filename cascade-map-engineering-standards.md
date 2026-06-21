# Engineering standards — cascade-map

Follow these rules for every file you touch. The goal: this should read like a senior engineer's side project, not a tutorial clone or a college assignment. If a choice in the spec conflicts with a rule here, this file wins.

## 1. Project structure

```
cascade-map/
├── apps/
│   ├── api/                      # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── schema-discovery/
│   │   │   │   │   ├── schema-discovery.controller.ts
│   │   │   │   │   ├── schema-discovery.service.ts
│   │   │   │   │   ├── schema-discovery.module.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── cascade/
│   │   │   │   ├── isolation-check/
│   │   │   │   └── delete-script/
│   │   │   ├── common/
│   │   │   │   ├── filters/        # global exception filter
│   │   │   │   ├── interceptors/   # logging, timeout
│   │   │   │   ├── pipes/          # validation
│   │   │   │   └── guards/         # rate limiting if added
│   │   │   ├── config/             # env validation/config service
│   │   │   ├── database/           # pg pool/connection setup, read-only enforcement
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/
│   │   ├── .env.example
│   │   └── package.json
│   └── web/                      # React frontend
│       ├── src/
│       │   ├── components/         # presentational, no business logic
│       │   ├── features/
│       │   │   ├── schema-graph/
│       │   │   ├── cascade-simulation/
│       │   │   └── isolation-panel/
│       │   ├── hooks/
│       │   ├── api/                # typed API client, one place all fetches live
│       │   ├── types/              # shared types (or import from packages/shared)
│       │   └── App.tsx
│       └── package.json
├── packages/
│   └── shared/                   # types shared between api and web (FK graph shape, cascade response shape, etc.)
├── docker-compose.yml            # local Postgres for dev
├── .github/workflows/ci.yml      # lint + typecheck + test on push
├── README.md
└── package.json                  # workspace root (npm/pnpm workspaces)
```

Rule: no business logic in controllers. Controllers only validate input (via DTOs) and call a service. Services contain logic. This separation is the single biggest "junior vs senior" tell in a NestJS repo.

## 2. TypeScript discipline

- `strict: true` in `tsconfig.json`, no exceptions
- No `any` — if a type is genuinely unknown, use `unknown` and narrow it
- Every API response and request body has an explicit TypeScript interface/DTO — never inline `{ table: string, id: number }` scattered across files; define it once in `packages/shared` and import it on both ends
- Use NestJS DTOs with `class-validator` decorators (`@IsString()`, `@IsInt()`, etc.) for every endpoint's input — validate at the boundary, don't trust query params

## 3. Error handling

- Never let a raw Postgres error reach the client. Catch DB errors in the service layer, throw a NestJS `HttpException` subtype (`BadRequestException`, `NotFoundException`) with a clear message
- One global exception filter (`common/filters/`) that formats all errors consistently:
```json
{ "statusCode": 400, "message": "Table 'foo' does not exist in this schema", "error": "Bad Request" }
```
- Frontend: every API call goes through a single wrapper that handles loading/error states consistently — no scattered `try/catch` with different shapes per component

## 4. Database safety (this matters a lot for this specific project)

- The app connects with a **read-only Postgres role** — never a role with `INSERT`/`UPDATE`/`DELETE` privileges. Create this role explicitly in the seed script and document it in the README. This is a real safety story you can talk about in an interview.
- All SQL goes through parameterized queries (`pg`'s `$1, $2` placeholders) — never string-concatenate table/column names from user input directly. Since table names ARE user input here (the `table` query param), validate them against the actual list of tables from `information_schema` before using them in any query — this prevents SQL injection via table name.
- Centralize all raw SQL in a `database/` or `repository` layer — services never write raw SQL inline, they call a repository method

## 5. Configuration

- All config (DB connection string, port, max traversal depth, row caps) comes from environment variables, validated on startup with a schema (e.g. `class-validator` on a `Config` class, or `zod`) — the app should refuse to boot with a clear error if `DATABASE_URL` is missing, not crash mysteriously on first request
- `.env.example` committed with every variable documented, `.env` gitignored
- No hardcoded magic numbers (`max depth 5`, `500 row cap`) — these live in config, not buried in a service file

## 6. Code quality tooling (set this up first, before writing features)

- ESLint + Prettier, shared config at the root, runs on save and in CI
- Husky + lint-staged: lint and format run automatically on `git commit` — a commit with lint errors should not be possible
- `tsc --noEmit` in CI to catch type errors before merge

## 7. Testing

- Not full coverage everywhere — but the **FK discovery logic** and **cascade traversal logic** (the actual algorithmic core of this project) need real unit tests, since that's what proves the engineering, not just the UI
- Use a test Postgres instance (or `pg-mem` / testcontainers) — mock the schema, assert the traversal produces the correct wave order
- At minimum: 5-10 meaningful tests on the cascade engine, not snapshot tests of UI components

## 8. Git hygiene

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` — this alone signals seniority in a git log
- No single giant commit — commit per logical unit (e.g. `feat: add FK auto-discovery service`, `feat: add cascade BFS traversal`, `feat: cascade animation frontend`)
- A real `.gitignore` (node_modules, .env, dist, .DS_Store)
- Meaningful PR-style commit messages even though you're working solo — write them as if a reviewer will read them

## 9. README (this is what people actually judge first)

Must include:
- One-paragraph problem statement: what real pain this solves, in plain English
- A GIF or screenshot of the cascade animation — this sells the project more than any text
- Architecture diagram or short explanation (FK discovery → cascade engine → animation)
- "Why read-only access is enforced" — a short safety note, shows production thinking
- How to run locally (docker-compose for DB, two `npm run dev` commands)
- Live demo link, clearly at the top
- A short "Roadmap" section listing what's NOT built yet (update-impact mode, etc.) — shows self-awareness, not over-claiming

## 10. Things that scream "college project" — avoid these specifically
- One giant `index.ts`/`app.ts` with everything in it
- `console.log` left in for debugging (use a real logger — NestJS's built-in `Logger`, or `pino`)
- No environment variables — hardcoded DB credentials in the code
- No error handling — assuming every request is well-formed
- Inconsistent naming (mixing `camelCase` and `snake_case` for the same concept across files)
- A README that's just "npm install && npm start" with no explanation of what the project does or why
