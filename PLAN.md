# Car Dealership Inventory System — Development Plan

Reference plan for the Incubyte TDD Kata. Work top to bottom; tick items as you go.
Each `[ ]` under a backend feature is **one Red → Green → (Refactor) cycle**.

---

## 0. Key Decisions

| Decision | Choice | Why |
|---|---|---|
| Backend | Express 5 + TypeScript | Required options; Express 5 forwards async errors to the error handler automatically |
| Database | Postgres — Docker locally/tests, Supabase in production | Real DB (in-memory not allowed); Docker keeps tests fast, isolated, offline |
| ORM / query layer | Drizzle ORM + `pg` (alternative: Prisma) | TS-native, lightweight, plays well with serverless on Vercel |
| Validation | Zod | One schema = runtime validation + TS types |
| Auth | Own JWT (`jsonwebtoken`) + `bcrypt` | Assignment wants *your* auth logic; Supabase Auth would hide it |
| Admin creation | Seed script from env vars, **never** via `/register` | Prevents privilege escalation (`role: "admin"` in request body) |
| IDs | UUID (`gen_random_uuid()`) | Unique, non-guessable |
| Price | `numeric(12,2)` (or integer cents) | Never use float for money |
| Quantity changes | Only via `purchase` / `restock`, not `PUT` | Keeps stock changes auditable and atomic |
| Tests | Jest + Supertest (backend), Vitest + RTL + MSW (frontend) | Integration tests at the HTTP level + unit tests for pure logic |
| Frontend | Vite + React + TS + Tailwind + React Router | Required stack; Vite is the modern default |
| Hosting | Vercel, `incubyte.somvanshi.dev` (DNS CNAME at name.com) | Free, simple, custom domain |
| Branding | **Rayfield Autoshow**, cyberpunk theme adapted from my portfolio (somvanshi.dev), prices in USD | Spec asks for creativity; details in UI_PLAN.md |
| Vehicle write access | Admin-only for create / update / delete / restock; any logged-in user can view, search, purchase | Spec's frontend section gives add/update/delete to admins; documented in README "Design decisions" |

---

## 1. Architecture

```
backend/
  src/
    app.ts                 # builds the Express app (imported by tests)
    server.ts              # starts listening (local dev only)
    config/env.ts          # reads + validates env vars with Zod
    db/
      client.ts            # pg pool + drizzle instance
      schema.ts            # users, vehicles tables
      migrations/
    modules/
      auth/
        auth.routes.ts     # HTTP wiring
        auth.controller.ts # req/res handling only
        auth.service.ts    # business logic (register, login)
        auth.schemas.ts    # Zod request schemas
      vehicles/
        vehicles.routes.ts
        vehicles.controller.ts
        vehicles.service.ts
        vehicles.repository.ts  # all SQL lives here
        vehicles.schemas.ts
    middleware/
      authenticate.ts      # verifies JWT → req.user
      requireAdmin.ts      # 403 if not admin
      validate.ts          # runs a Zod schema on body/query/params
      errorHandler.ts      # maps errors → consistent JSON
    lib/
      errors.ts            # AppError, NotFoundError, ConflictError...
      password.ts          # hash / compare
      jwt.ts               # sign / verify
    scripts/seedAdmin.ts
  tests/
    helpers/               # db reset, createUser, loginAs, createVehicle
    auth/*.test.ts
    vehicles/*.test.ts
    unit/*.test.ts
frontend/
  src/
    api/                   # fetch wrapper + typed endpoint functions
    context/AuthContext.tsx
    components/            # VehicleCard, SearchBar, VehicleForm, Navbar...
    pages/                 # Login, Register, Dashboard, Admin
    routes/                # ProtectedRoute, AdminRoute
  tests/ (or *.test.tsx next to components)
```

**SOLID talking points**
- **S**ingle responsibility: routes → controller → service → repository, each one job.
- **D**ependency inversion: services receive the repository (constructor/factory), so unit tests can pass a fake.
- **O**pen/closed: new error types extend `AppError`; the error handler doesn't change.

---

## 2. API Contract

### Error format (every error)
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Price must be positive", "details": [...] } }
```

### Status codes
| Code | When |
|---|---|
| 200 | Successful read/update/purchase/restock |
| 201 | Created (register, add vehicle) |
| 204 | Deleted |
| 400 | Validation failed |
| 401 | Missing / invalid / expired token, wrong login credentials |
| 403 | Valid token but not admin |
| 404 | Vehicle not found (also for malformed UUID — or 400, pick one and be consistent) |
| 409 | Email already registered, out of stock |

### Product Spec (drives backend validation; UI details in UI_PLAN.md)

**User fields**
| Field | Rules |
|---|---|
| name | required, trimmed, 1–60 chars |
| email | required, valid format, stored lowercased, unique |
| password | required, 8–72 chars (bcrypt max 72 bytes) |
| role | `user` (default) or `admin` — never settable via API |

**Vehicle fields**
| Field | Rules | Spec? |
|---|---|---|
| id | UUID, generated | required by spec |
| make | required, trimmed, 1–50 chars | required by spec |
| model | required, trimmed, 1–50 chars | required by spec |
| category | required, one of `SEDAN, SUV, HATCHBACK, COUPE, CONVERTIBLE, TRUCK, VAN` | required by spec |
| price | required, number > 0, ≤ 100,000,000, max 2 decimals | required by spec |
| quantity | integer ≥ 0; set on create (default 0), then only via purchase/restock | required by spec |
| year | required, integer 1900 … current year + 1 | extra (confirmed; makes cards realistic) |
| imageUrl | optional, valid `https://` URL; UI falls back to category icon | extra (stretch — add after core) |
| createdAt / updatedAt | generated | — |

**Behaviour**
- Purchase = 1 unit per click (API also accepts optional `{ quantity }`).
- `GET /api/vehicles` returns all vehicles, newest first, including sold-out ones.
- Search params: `make`, `model` (case-insensitive partial), `category` (exact), `minPrice`, `maxPrice` (inclusive). "In stock only" is a frontend filter.
- No pagination (inventory is small) — mention as future work.
- Currency: USD. Store a plain number; display with `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` → `$125,000.00`.
- Category list is a shared constant; frontend dropdown uses the same values.

### Data model
**users**: `id uuid pk`, `name text`, `email text unique (lowercased)`, `password_hash text`, `role text check in ('user','admin') default 'user'`, `created_at`
**vehicles**: `id uuid pk`, `make text`, `model text`, `year int`, `category text check in (...)`, `price numeric(12,2) check > 0`, `quantity int check >= 0 default 0`, `image_url text null`, `created_at`, `updated_at`

---

## 3. Phase 1 — Setup

- [ ] Create empty GitHub repo (no README/.gitignore), `git init -b main`, add remote
- [ ] `.gitignore` excludes `.env`, `node_modules`, `dist`, `coverage`, the assignment PDF
- [ ] Scaffold backend (one prompt, one `chore:` commit): Express + TS, Jest + Supertest, ESLint + Prettier, docker-compose test Postgres, `.env.example`
- [ ] Health-check test → red → green (proves runner works)
- [ ] `CLAUDE.md` with TDD + commit rules
- [ ] Add `zod`, `drizzle-orm`, `pg`, `drizzle-kit`; schema + first migration
- [ ] Test helpers: run migrations once before all tests, truncate tables before each test
- [ ] `npm test` runs with `--runInBand` (tests share one DB)
- [ ] Jest coverage threshold (e.g. 90% lines) in `jest.config`

---

## 4. Phase 2 — Backend Features (TDD test list)

### 4.1 `POST /api/auth/register`
- [ ] Valid name + email + password → 201 with `{ id, name, email, role: "user" }`
- [ ] Missing name → 400
- [ ] Response never contains password or hash
- [ ] Password is stored hashed (DB value ≠ plain text, bcrypt compare passes)
- [ ] Missing email → 400
- [ ] Invalid email format → 400
- [ ] Password shorter than 8 chars → 400
- [ ] Duplicate email → 409
- [ ] Email is case-insensitive (`A@x.com` and `a@x.com` conflict)
- [ ] `role: "admin"` in body is ignored → user created as `"user"`

### 4.2 `POST /api/auth/login`
- [ ] Correct credentials → 200 with `{ token, user }`
- [ ] Token is a valid JWT containing `sub` (user id) and `role`
- [ ] Wrong password → 401 (generic message)
- [ ] Unknown email → 401 (same message — don't leak which emails exist)
- [ ] Missing fields → 400

### 4.3 Auth middleware (test via a protected route, e.g. `GET /api/vehicles`)
- [ ] No `Authorization` header → 401
- [ ] Malformed header (not `Bearer <token>`) → 401
- [ ] Invalid signature → 401
- [ ] Expired token → 401
- [ ] Valid token → request passes through
- [ ] `requireAdmin`: user token → 403, admin token → passes

### 4.4 `POST /api/vehicles`
- [ ] Admin with valid body → 201 with vehicle incl. generated `id`
- [ ] Persists in DB (follow-up GET finds it)
- [ ] Missing make/model/year/category/price → 400 (one test per field, or a table-driven `it.each`)
- [ ] Category not in allowed list → 400
- [ ] Year out of range → 400
- [ ] (stretch) `imageUrl` not a valid https URL → 400
- [ ] Price ≤ 0 or non-number → 400
- [ ] Quantity negative or non-integer → 400; omitted → defaults to 0
- [ ] Non-admin → 403
- [ ] No token → 401

### 4.5 `GET /api/vehicles`
- [ ] Empty DB → 200 with `[]`
- [ ] Returns all vehicles with all fields
- [ ] Includes out-of-stock vehicles (frontend shows them with disabled Purchase) — document this decision
- [ ] Stable ordering (e.g. newest first)
- [ ] No token → 401

### 4.6 `GET /api/vehicles/search`
- [ ] Route is registered **before** `/:id` (otherwise "search" is treated as an id)
- [ ] `?make=toyota` → only Toyotas, case-insensitive
- [ ] `?model=cor` → partial match
- [ ] `?category=SUV` → exact (case-insensitive) match
- [ ] `?minPrice=10000` / `?maxPrice=30000` / both → inclusive range
- [ ] Filters combine with AND
- [ ] No filters → returns all
- [ ] No matches → 200 `[]`
- [ ] `minPrice > maxPrice` → 400
- [ ] Non-numeric price → 400

### 4.7 `PUT /api/vehicles/:id`
- [ ] Valid update → 200 with updated vehicle; `updated_at` changes
- [ ] Partial body updates only given fields (decide: PUT accepts partial, or add PATCH — document)
- [ ] `quantity` in body is rejected (400) or ignored — stock changes only via purchase/restock
- [ ] Invalid values → 400
- [ ] Unknown id → 404
- [ ] Malformed id → 400/404 (consistent)
- [ ] Regular user → 403
- [ ] No token → 401

### 4.8 `DELETE /api/vehicles/:id` (admin)
- [ ] Admin → 204, vehicle gone
- [ ] Unknown id → 404
- [ ] Regular user → 403
- [ ] No token → 401

### 4.9 `POST /api/vehicles/:id/purchase`
- [ ] In stock → 200, quantity decreases by 1
- [ ] Optional `{ quantity: n }` decreases by n (decide if you support this)
- [ ] Quantity 0 → 409 "Out of stock", quantity unchanged
- [ ] Requesting more than available → 409
- [ ] Unknown id → 404
- [ ] **Concurrency**: quantity 1, two parallel purchases → exactly one 200, one 409, final quantity 0
  - Implementation: single atomic `UPDATE vehicles SET quantity = quantity - $n WHERE id = $id AND quantity >= $n RETURNING *`
- [ ] No token → 401

### 4.10 `POST /api/vehicles/:id/restock` (admin)
- [ ] Admin, `{ quantity: 5 }` → 200, quantity increases by 5
- [ ] Missing / zero / negative / non-integer quantity → 400
- [ ] Unknown id → 404
- [ ] Regular user → 403

### 4.11 Cross-cutting
- [ ] Unknown route → 404 JSON (not HTML)
- [ ] Malformed JSON body → 400 JSON
- [ ] Unexpected error → 500 JSON without stack trace in production
- [ ] CORS allows only the frontend origin (env var)
- [ ] `scripts/seedAdmin.ts` creates admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (idempotent)
- [ ] Optional: `helmet`, rate-limit on `/api/auth/*`

### Unit tests (pure logic, no DB)
- [ ] `password.hash` / `password.compare`
- [ ] `jwt.sign` / `jwt.verify` (valid, expired, tampered)
- [ ] Zod schemas for edge cases if not fully covered by integration tests

---

## 5. Phase 3 — Frontend

Lighter TDD: write component tests first for **behaviour** (not styling).

### Setup
- [ ] Vite React-TS in `frontend/`, Tailwind, React Router, ESLint/Prettier
- [ ] Vitest + React Testing Library + `@testing-library/user-event` + MSW
- [ ] `src/api/client.ts`: base URL from `VITE_API_URL`, attaches token, parses error format

### Auth
- [ ] `AuthContext`: stores token + user (localStorage — know the XSS trade-off vs httpOnly cookies)
- [ ] Register form: validation messages, success → redirect to login (or auto-login)
- [ ] Login form: shows API error on 401, success → dashboard
- [ ] Logout clears token
- [ ] `ProtectedRoute` redirects to login when logged out
- [ ] `AdminRoute` hides admin pages from regular users
- [ ] 401 from any API call → logout + redirect

### Dashboard
- [ ] Lists vehicles as cards (make, model, category, price formatted as currency, stock)
- [ ] Loading state, empty state, error state
- [ ] **Purchase button disabled when quantity is 0** ← explicitly required, must have a test
- [ ] Purchase click → calls API, updates quantity on screen, shows success toast
- [ ] Purchase 409 → shows "Out of stock" message

### Search / filter
- [ ] Search bar: make, model, category (dropdown), min/max price
- [ ] Submitting calls `/api/vehicles/search` with only filled params
- [ ] Clear filters resets list
- [ ] Optional: debounce, sync filters to URL query string

### Admin
- [ ] Add vehicle form with validation → appears in list
- [ ] Edit vehicle (prefilled form) → list updates
- [ ] Delete with in-page confirmation → removed from list
- [ ] Restock control (quantity input)
- [ ] Admin controls not rendered for regular users

### Design / UX
- [ ] Responsive: mobile (1 col) → tablet (2) → desktop (3–4)
- [ ] Consistent colour palette, typography, spacing; dark mode optional
- [ ] Accessible: labels on inputs, focus states, buttons not divs, `aria-live` for toasts
- [ ] Nice touches: skeleton loaders, stock badge ("Only 2 left", "Sold out"), category icons

---

## 6. Phase 4 — Deploy (Vercel + Supabase)

### Supabase
- [ ] Create project; copy **pooler** connection string (transaction mode, port 6543) for the app
- [ ] Use direct/session connection string for running migrations
- [ ] Run migrations against Supabase; run `seedAdmin`
- [ ] **Enable RLS on `users` and `vehicles` with no policies** — Supabase exposes `public` tables through its Data API; your backend connects as the DB owner and bypasses RLS, but the anon key can't read your users table
- [ ] Store the connection string only in Vercel env vars

### Vercel
- [ ] Backend project (root `backend/`): export the Express app for Vercel's Express support / serverless function; env: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`
- [ ] Frontend project (root `frontend/`): env `VITE_API_URL`; SPA rewrite so deep links (`/admin`) don't 404
- [ ] Alternative: single project with `/api/*` rewrite to the function (no CORS needed)
- [ ] Domain: add `incubyte.somvanshi.dev` in Vercel → CNAME `incubyte` → `cname.vercel-dns.com` at name.com (or wherever nameservers point)
- [ ] Smoke test live: register, login, admin add, purchase until 0, button disables

---

## 7. Phase 5 — Documentation & Deliverables

### README.md
- [ ] Project overview + feature list
- [ ] Tech stack + **design decisions** (from section 0, incl. admin-only choices, quantity via purchase/restock)
- [ ] Architecture diagram / folder overview
- [ ] Local setup: prerequisites (Node, Docker), `.env` setup, `docker compose up`, migrate, seed admin, run backend, run frontend
- [ ] How to run tests + coverage
- [ ] API endpoint table
- [ ] Screenshots (`docs/screenshots/`): login, dashboard, search, sold-out card, admin form, mobile view
- [ ] Live link
- [ ] Note: tests use a real Postgres in Docker (tmpfs for speed); production uses Supabase — not an in-memory DB

### "My AI Usage" (mandatory)
- [ ] Tools: Claude Code (Opus) — planning chat + development sessions
- [ ] How: planning & test lists, scaffolding, writing tests, implementation, reviews — with concrete examples
- [ ] What I did: stack choice, decisions, reviewing every diff, edge cases I added, places AI was wrong and I corrected it
- [ ] Reflection: honest impact on speed, quality, learning TDD

### Other deliverables
- [ ] **PROMPTS.md**: raw logs — `/export` from every Claude Code session (planning chat + project sessions), no summaries
- [ ] **Test report**: `jest --coverage` output + `vitest --coverage`; commit a summary (e.g. `docs/test-report.md` with pasted output or screenshot); optionally `jest-html-reporter`
- [ ] Repo is **public**; PDF and `.env` not committed (check `git log --all -- '*.pdf' '.env'` is empty)

---

## 8. Git & Commit Conventions

```
test: add failing test for purchase when quantity is zero        ← RED
feat: return 409 when purchasing an out-of-stock vehicle         ← GREEN
refactor: move stock check into atomic repository update         ← REFACTOR
```

Commit body template:
```
feat: return 409 when purchasing an out-of-stock vehicle

AI: wrote the conditional UPDATE and the OutOfStockError mapping.
Me: reviewed the SQL, added the concurrency test case.


Co-authored-by: Claude <noreply@anthropic.com>
```

Rules
- Red commit contains **only** the test (it fails). Green commit contains **only** what makes it pass.
- Refactor commit only if something genuinely improved.
- Other prefixes: `chore:` (tooling), `docs:`, `style:` (formatting), `ci:`.
- Co-author trailer on every AI-assisted commit; omit only if you truly wrote it alone.
- Push at least at the end of every session.

---

## 9. Quality Gates (before every push)

- [ ] `npm test` green (backend + frontend)
- [ ] `npm run lint` and `npm run typecheck` clean
- [ ] No `console.log` leftovers, no commented-out code
- [ ] Optional: GitHub Actions running lint + tests on push (spins up Postgres service) — nice signal for reviewers

---