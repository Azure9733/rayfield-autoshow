# Car Dealership Inventory System — Development Plan

Reference plan for the Incubyte TDD Kata. Work top to bottom; tick items as you go.
Each `[ ]` under a backend feature is **one Red → Green → (Refactor) cycle**; §4 explains the **(guard)**, `it.each` and `unit:` markers.

---

## 0. Key Decisions

| Decision | Choice | Why |
|---|---|---|
| Backend | Express 5 + TypeScript | Required options; Express 5 forwards async errors to the error handler automatically |
| Database | Postgres — Docker locally (separate dev and test DBs, same major version as Supabase), Supabase in production | Real DB (in-memory not allowed); Docker keeps tests fast, isolated, offline; tests wipe tables, so they get their own DB |
| ORM / query layer | Drizzle ORM + `pg` | TS-native, lightweight, plays well with serverless on Vercel |
| Validation | Zod | One schema = runtime validation + TS types |
| Auth | Own JWT (`jsonwebtoken`) + `bcryptjs` (cost factor from env, low in tests) | Assignment wants *your* auth logic; Supabase Auth would hide it. `bcryptjs` is pure JS, so no native build on Vercel |
| Admin creation | Seed script from env vars, **never** via `/register`; re-running it resets the admin's password and role from env | Prevents privilege escalation (`role: "admin"` in request body); someone who registered the admin email first can't keep the account |
| IDs | UUID (`gen_random_uuid()`); a malformed `:id` → 400 from one shared check | Unique, non-guessable; without the check Postgres throws and the API returns 500 |
| Price | `numeric(12,2)`; the repository converts it to a JS number, so the API always returns a number | Never use float for money; `pg` returns `numeric` as a string, so convert in one place |
| Quantity changes | Only via `purchase` (always 1 unit) / `restock` (1–10,000 per call), not `PUT` (PUT ignores `quantity`) | Keeps stock changes auditable and atomic |
| Unknown / forbidden fields | Ignored everywhere (Zod strips them): `role` on register, `quantity` on PUT, `id` on create | One rule, no mass assignment |
| Vehicle updates | `PUT` = full replacement of the editable fields (same validation as create, minus `quantity`) | The edit form is prefilled and always sends every field |
| Categories | Case-insensitive input (trimmed, uppercased); unknown → 400. Frontend keeps a copy of the list with a "keep in sync" comment | No shared package between `backend/` and `frontend/` |
| Duplicate vehicles | Allowed (same make/model/year can be different trims) | Documented in README |
| Errors | One JSON format (§2); never a stack trace in a response (logged server-side instead) | Nothing environment-dependent to test |
| Tests | Jest + Supertest (backend), Vitest + RTL + MSW (frontend) | Integration tests at the HTTP level + unit tests for pure logic |
| Frontend | Vite + React + TS + Tailwind + React Router | Required stack; Vite is the modern default |
| After register | Frontend logs the user in automatically (calls login) | Backend contract stays as tested |
| Hosting | Vercel, two projects (backend, frontend). The frontend rewrites `/api/*` to the backend (Vite proxy locally), so the browser sees one origin — no CORS. `incubyte.somvanshi.dev` (DNS CNAME at name.com) on the frontend project | Free, simple, custom domain |
| Branding | **Rayfield Autoshow**, cyberpunk theme adapted from my portfolio (somvanshi.dev), prices in USD | Spec asks for creativity; details in UI_PLAN.md; logo and CodePen glitch effects credited in README |
| Vehicle write access | Admin-only for create / update / delete / restock; any logged-in user can view, search, purchase | Spec's frontend section gives add/update/delete to admins; documented in README "Design decisions" |

---

## 1. Architecture

```
backend/
  src/
    app.ts                 # createApp({ repos }) builds the Express app (imported by tests)
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
        users.repository.ts     # all users SQL lives here
      vehicles/
        vehicles.routes.ts
        vehicles.controller.ts
        vehicles.service.ts
        vehicles.repository.ts  # all vehicles SQL lives here; converts price to a number
        vehicles.schemas.ts
        categories.ts      # category list (frontend keeps a copy)
    middleware/
      authenticate.ts      # verifies JWT → req.user
      requireAdmin.ts      # 403 if not admin
      validate.ts          # runs a Zod schema on body/query/params → res.locals; also the shared UUID :id check
      errorHandler.ts      # maps errors → consistent JSON, never a stack trace
    lib/
      errors.ts            # AppError, NotFoundError, ConflictError...
      password.ts          # hash / compare (bcryptjs, cost from env)
      jwt.ts               # sign / verify
    scripts/
      seedAdmin.ts         # creates the admin, or resets its password + role, from env
      seedDemo.ts          # replaces all vehicles with sample data (local + live demo)
  tests/
    helpers/               # db reset, createUser, loginAs, createVehicle (accepts createdAt)
    auth/*.test.ts
    vehicles/*.test.ts
    unit/*.test.ts
frontend/
  src/
    api/                   # fetch wrapper (relative /api) + typed endpoint functions
    constants/categories.ts  # copy of the backend list — keep in sync
    context/AuthContext.tsx
    components/            # Header, VehicleCard, SearchPanel, VehicleFormModal... (full list: UI_PLAN.md §9)
    pages/                 # Login, Register, Inventory, NotFound
    routes/                # ProtectedRoute
  tests/ (or *.test.tsx next to components)
```

**Express 5 notes**
- `req.query` is read-only (a getter), so `validate.ts` puts parsed values on `res.locals` instead of assigning to `req.query`.
- Catch-all 404: `app.use((req, res) => …)` with no path — `app.all('*')` throws at startup (wildcards must be named in Express 5).

**SOLID talking points**
- **S**ingle responsibility: routes → controller → service → repository, each one job.
- **D**ependency inversion: `createApp({ repos })` hands the repositories to the services; tests pass the real ones, and the 500 test passes a repo that throws.
- **O**pen/closed: new error types extend `AppError`; the error handler doesn't change.

---

## 2. API Contract

### Error format (every error)
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Price must be positive", "details": [{ "field": "price", "message": "Price must be positive" }] } }
```
`details` has one entry per invalid field (the UI shows each under its field). No response ever includes a stack trace.

### Status codes
| Code | When |
|---|---|
| 200 | Successful read/update/purchase/restock |
| 201 | Created (register, add vehicle) |
| 204 | Deleted |
| 400 | Validation failed — incl. malformed `:id` (shared UUID check), unknown category, malformed JSON body |
| 401 | Missing / invalid / expired token, wrong login credentials |
| 403 | Valid token but not admin |
| 404 | Vehicle not found; unknown route |
| 409 | Email already registered, out of stock |
| 500 | Unexpected error (generic message, no stack trace) |

### Product Spec (drives backend validation; UI details in UI_PLAN.md)

**User fields**
| Field | Rules |
|---|---|
| name | required, trimmed, 1–60 chars |
| email | required, valid format, stored lowercased, unique |
| password | required, ≥ 8 characters and ≤ 72 **bytes** in UTF-8 (bcrypt ignores everything after byte 72) |
| role | `user` (default) or `admin` — never settable via API |

**Vehicle fields**
| Field | Rules | Spec? |
|---|---|---|
| id | UUID, generated (a client-sent `id` is ignored) | required by spec |
| make | required, trimmed, 1–50 chars | required by spec |
| model | required, trimmed, 1–50 chars | required by spec |
| category | required, one of `SEDAN, SUV, HATCHBACK, COUPE, CONVERTIBLE, TRUCK, VAN`; input is case-insensitive (trimmed + uppercased), anything else → 400 | required by spec |
| price | required, number > 0, ≤ 100,000,000, max 2 decimals; always returned as a JSON number | required by spec |
| quantity | integer 0–10,000 on create (default 0); afterwards only via purchase (−1) / restock (+1 to +10,000 per call); PUT ignores it | required by spec |
| year | required, integer 1900 … current year + 1 | extra (confirmed; makes cards realistic) |
| imageUrl | optional, valid `https://` URL; UI falls back to category icon | extra (stretch — add after core) |
| createdAt / updatedAt | generated | — |

**Behaviour**
- API fields are camelCase; DB columns are snake_case (Drizzle maps them).
- Unknown fields in a request body are ignored (Zod strips them).
- Register → 201 `{ id, name, email, role }`; login → 200 `{ token, user }`. The frontend logs in right after a successful register.
- Purchase = always 1 unit; any request body is ignored. Purchase and restock return 200 with the updated vehicle.
- `PUT /api/vehicles/:id` replaces make, model, year, category, price and imageUrl (same validation as create); `quantity` is ignored.
- `GET /api/vehicles` returns all vehicles, newest first, including sold-out ones.
- Search params: `make`, `model` (case-insensitive partial; `%` and `_` match literally), `category` (case-insensitive exact; unknown → 400), `minPrice`, `maxPrice` (inclusive). Empty params (`?make=`) count as absent; filters combine with AND. "In stock only" is a frontend filter.
- Duplicate vehicles (same make/model/year) are allowed.
- No pagination (inventory is small) — mention as future work.
- Currency: USD. The API returns a plain number; display with `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` → `$125,000.00`.
- The category list lives in `backend/src/modules/vehicles/categories.ts`; the frontend dropdown uses a copy in `frontend/src/constants/categories.ts` with a "keep in sync" comment.

### Data model
**users**: `id uuid pk`, `name text`, `email text unique (lowercased)`, `password_hash text`, `role text check in ('user','admin') default 'user'`, `created_at`
**vehicles**: `id uuid pk`, `make text`, `model text`, `year int`, `category text check in (...)`, `price numeric(12,2) check > 0`, `quantity int check >= 0 default 0`, `image_url text null`, `created_at`, `updated_at`

---

## 3. Phase 1 — Setup

- [ ] Create empty GitHub repo (no README/.gitignore), `git init -b main`, add remote
- [ ] `CLAUDE.md` **first**, before any AI-written code: TDD + commit rules (exact co-author trailer from §8, guard tests), comment style (§9), and "never read or print real env files" (every session goes unedited into the public PROMPTS.md)
- [ ] `.gitignore` excludes `.env*` (except `.env.example` and `.env.test`), `node_modules`, `dist`, `coverage`, `.vercel/`, the assignment PDF
- [ ] Scaffold backend (one prompt, one `chore:` commit): Express + TS, Jest + Supertest, ESLint + Prettier, docker-compose with **separate dev (volume) and test (tmpfs) Postgres** on the same major version as the Supabase project, `.env.example`, `.env.test` (committed: local test DB and dummy secrets only)
- [ ] Health-check test → red → green (proves runner works)
- [ ] Add `zod`, `drizzle-orm`, `pg`, `drizzle-kit`; schema + first migration
- [ ] Test helpers: load `.env.test`, run migrations once before all tests, truncate tables before each test, close the pg pool after all tests (otherwise Jest hangs)
- [ ] `npm test` runs with `--runInBand` (tests share one DB)
- [ ] Jest coverage threshold (e.g. 90% lines) in `jest.config`; exclude `server.ts`, migrations and script entry points

---

## 4. Phase 2 — Backend Features (TDD test list)

How to read this list:
- One `[ ]` = one cycle: write a failing test (red), write the least code that makes it pass (green), then tidy up (refactor).
- `it.each` = a table of examples for one rule; still one cycle. Limits are tested from both sides: just outside → 400, exactly on the limit → accepted.
- **(guard)** = will probably pass the first time it runs, because earlier code already covers it. Keep it as regression protection: check it fails when you briefly break the code, then commit it as `test: guard …` (§8). If it does fail, it's a normal cycle.
- `unit:` = tests a module directly (no HTTP, no DB), written when that module is first needed.

### 4.1 `POST /api/auth/register`
- [ ] Valid name + email + password → 201 with exactly `{ id, name, email, role: "user" }` (walking skeleton: route → controller → service → repository → DB, so the biggest cycle by design)
- [ ] **(guard)** Response never contains password or hash
- [ ] `unit:` `password.hash` then `compare` → true for the right password, false for a wrong one
- [ ] Password is stored hashed (DB value ≠ plain text, `compare` passes)
- [ ] Missing name → 400
- [ ] Validation errors use the standard format: `code: "VALIDATION_ERROR"` and `details: [{ field, message }]`
- [ ] Name rule (`it.each`): whitespace-only, 61 chars → 400; 60 chars accepted; `"  Ann  "` stored as `"Ann"`
- [ ] Email rule (`it.each`): missing, invalid format → 400
- [ ] Password rule (`it.each`): missing, 7 chars, 73 ASCII chars, 19 emoji (passes a 72-character check but is 76 bytes) → 400; exactly 8 chars and exactly 72 bytes accepted
- [ ] Duplicate email → 409
- [ ] Email is case-insensitive: stored lowercased, so `A@x.com` then `a@x.com` → 409
- [ ] **(guard)** `role: "admin"` in body is ignored → user created as `"user"`

### 4.2 `POST /api/auth/login`
- [ ] `unit:` `jwt.sign` then `jwt.verify` keeps `sub` and `role`; the token has an `exp`
- [ ] Correct credentials → 200 with `{ token, user }`
- [ ] **(guard)** Token is a valid JWT containing `sub` (user id), `role` and `exp`
- [ ] **(guard)** `user` in the response never contains the password hash
- [ ] Wrong password → 401 (generic message)
- [ ] Unknown email → 401 (same message — don't leak which emails exist)
- [ ] Email is case-insensitive (register `a@x.com`, log in as `A@X.com` → 200)
- [ ] Missing fields (`it.each`: email, password) → 400

### 4.3 `GET /api/vehicles` (comes before the middleware, so 4.4 has a real route to protect)
Seed rows with the `createVehicle` helper, and send a valid token in every test from the start; it's ignored until 4.4 adds the middleware.
- [ ] Empty DB → 200 with `[]`
- [ ] Returns all vehicles with all fields (camelCase)
- [ ] `price` is a JSON number, not a string
- [ ] **(guard)** Includes out-of-stock vehicles (frontend shows them with disabled Purchase) — documented in README
- [ ] Newest first (give the helper explicit `createdAt` values: rows inserted in one statement share a timestamp)

### 4.4 Auth middleware (tested via `GET /api/vehicles`)
- [ ] No `Authorization` header → 401
- [ ] Malformed header (`it.each`: `Basic abc`, `Bearer` with no token, a bare token) → 401
- [ ] **(guard)** `unit:` `jwt.verify` rejects tampered and expired tokens (`it.each`)
- [ ] Invalid signature → 401
- [ ] **(guard)** Expired token → 401
- [ ] **(guard)** Valid token → request passes through (4.3's tests already send one)

`requireAdmin` gets built in 4.5, driven by "Non-admin → 403".

### 4.5 `POST /api/vehicles` (admin)
- [ ] Admin with valid body → 201 with vehicle incl. generated `id`
- [ ] Persists in DB (follow-up `GET /api/vehicles` finds it)
- [ ] Non-admin → 403 (builds `requireAdmin`; the admin 201 above already shows admins pass)
- [ ] **(guard)** No token → 401 (if `authenticate` covers the whole vehicles router)
- [ ] Required fields (`it.each`): missing make / model / year / category / price → 400
- [ ] Make/model rule (`it.each`): whitespace-only, 51 chars → 400; 50 chars accepted; surrounding spaces trimmed
- [ ] Category rule (`it.each`): `BOAT` → 400; `suv` → 201, stored as `SUV`
- [ ] Year rule (`it.each`): 1899, current year + 2 → 400; 1900, current year + 1 accepted (compute the year in the test, never hard-code it)
- [ ] Price rule (`it.each`): 0, −1, `"abc"`, 1.234, 100,000,000.01 → 400; 0.01, 19.99, 100,000,000 accepted (in JS `19.99 * 100` isn't an integer, so don't check decimals that way)
- [ ] Quantity rule (`it.each`): −1, 1.5, 10,001 → 400; 0 and 10,000 accepted
- [ ] Quantity omitted → defaults to 0
- [ ] **(guard)** A client-sent `id` is ignored (the server generates it)
- [ ] **(guard)** Same make/model/year twice → both created
- [ ] (stretch) imageUrl rule (`it.each`): `http://…` or not a URL → 400; omitted is fine

### 4.6 `GET /api/vehicles/search`
- [ ] `?make=Toyota` → only Toyotas (exact case first: the simplest test for a new endpoint)
- [ ] Make matching is case-insensitive (`?make=toyota`)
- [ ] Make matching is partial (`?make=toy`)
- [ ] `?model=cor` → partial, case-insensitive match
- [ ] `%` and `_` match literally (`?make=%` doesn't return everything)
- [ ] `?category=suv` → only SUVs (normalised to uppercase)
- [ ] **(guard)** Unknown category → 400 (reuses the category rule from 4.5)
- [ ] `?minPrice=` → inclusive lower bound (a vehicle priced exactly at `minPrice` is included)
- [ ] `?maxPrice=` → inclusive upper bound
- [ ] **(guard)** Filters combine with AND (e.g. `make` + `maxPrice`, `minPrice` + `maxPrice`)
- [ ] **(guard)** No filters → returns all
- [ ] **(guard)** No matches → 200 `[]`
- [ ] Empty params count as absent (`it.each`: `?make=`, `?category=`, `?minPrice=`)
- [ ] `minPrice > maxPrice` → 400
- [ ] Non-numeric price (`it.each`: `minPrice`, `maxPrice`) → 400
- [ ] **(guard)** No token → 401

### 4.7 `PUT /api/vehicles/:id` (admin; full replacement)
- [ ] Valid full update → 200 with the updated vehicle
- [ ] `updatedAt` changes on update
- [ ] Body is validated like create (`it.each`: a missing field, an invalid value) → 400
- [ ] **(guard)** `quantity` in the body is ignored; stock unchanged
- [ ] Unknown id → 404
- [ ] Malformed id → 400 (builds the shared UUID check)
- [ ] Non-admin → 403
- [ ] **(guard)** No token → 401

### 4.8 `DELETE /api/vehicles/:id` (admin)
- [ ] Admin → 204, vehicle gone
- [ ] Unknown id → 404
- [ ] **(guard)** Malformed id → 400 (shared UUID check)
- [ ] Non-admin → 403
- [ ] **(guard)** No token → 401

### 4.9 `POST /api/vehicles/:id/purchase` (always 1 unit)
- [ ] In stock → 200 with the updated vehicle, quantity decreased by 1
- [ ] Quantity 0 → 409 "Out of stock", quantity unchanged
- [ ] Unknown id → 404 (the atomic UPDATE returns no row for both "not found" and "out of stock", so check existence after a miss)
- [ ] **(guard)** Malformed id → 400
- [ ] **(guard)** **Concurrency**: 10 parallel purchases at quantity 5 → five 200s, five 409s, final quantity 0
  - Implementation: single atomic `UPDATE vehicles SET quantity = quantity - 1 WHERE id = $id AND quantity > 0 RETURNING *`. A guard if you write it this way from the first test; two requests alone might not overlap, hence 10.
- [ ] **(guard)** No token → 401

### 4.10 `POST /api/vehicles/:id/restock` (admin)
- [ ] Admin, `{ quantity: 5 }` → 200 with the updated vehicle, quantity increased by 5
- [ ] Quantity rule (`it.each`): missing, 0, −1, 1.5, 10,001 → 400; 1 and 10,000 accepted
- [ ] Unknown id → 404
- [ ] **(guard)** Malformed id → 400
- [ ] Non-admin → 403
- [ ] **(guard)** No token → 401

### 4.11 Cross-cutting
- [ ] Unknown route → 404 JSON (not HTML)
- [ ] Malformed JSON body → 400 JSON
- [ ] Unexpected error → 500 JSON with a generic message and no stack trace (inject a repo that throws via `createApp({ repos })`)
- [ ] `seedAdmin` creates the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- [ ] Re-running `seedAdmin` resets the admin's password and role from env, including when that email already belongs to a normal user
- [ ] `seedDemo` replaces all vehicles with the sample set (safe to re-run)
- [ ] Optional, only if time allows: `helmet` (responses carry its security headers). No rate limiting: it would 429 the auth tests, and an in-memory limit doesn't hold across Vercel instances.

---

## 5. Phase 3 — Frontend

Lighter TDD: write component tests first for **behaviour** (not styling). The frontend test list lives in **UI_PLAN.md §10** (single source); this section is the build order.

### Setup
- [ ] Vite React-TS in `frontend/`, Tailwind, React Router, ESLint/Prettier
- [ ] Vitest + React Testing Library + `@testing-library/user-event` + MSW
- [ ] Vite dev proxy `/api` → local backend; production uses the Vercel rewrite, so the app always calls relative `/api/...` (no `VITE_API_URL`)
- [ ] `src/api/client.ts`: attaches the token, parses the error format, global 401 handler that skips `/api/auth/*`
- [ ] `src/constants/categories.ts`: copy of the backend category list with a "keep in sync" comment

### Build order
- [ ] Auth: `AuthContext` (token + user in localStorage — know the XSS trade-off vs httpOnly cookies), register (logs in automatically on success), login, logout, `ProtectedRoute`, session-expired redirect
- [ ] Inventory page (`/`): vehicle grid, loading / empty / error states, purchase (1 unit)
- [ ] Search / filter panel, incl. the client-side "in stock only" filter
- [ ] Admin controls on the same page, rendered by role (no `/admin` route): add / edit modal, delete confirmation, restock popover
- [ ] Optional: debounce, sync filters to URL query string

### Design / UX (details in UI_PLAN.md)
- [ ] Responsive: mobile (1 col) → tablet (2) → desktop (3–4)
- [ ] Consistent colour palette, typography, spacing
- [ ] Accessible: labels on inputs, focus states, buttons not divs, `aria-live` for toasts
- [ ] Nice touches: skeleton loaders, stock badge ("Only 2 left", "Sold out"), category icons

---

## 6. Phase 4 — Deploy (Vercel + Supabase)

### Supabase
- [ ] Create project; copy **pooler** connection string (transaction mode, port 6543) for the app
- [ ] Use direct/session connection string for running migrations
- [ ] Run migrations against Supabase; run `seedAdmin` and `seedDemo`
- [ ] **Enable RLS on `users` and `vehicles` with no policies** — Supabase exposes `public` tables through its Data API; your backend connects as the DB owner and bypasses RLS, but the anon key can't read your users table
- [ ] Store the connection string only in Vercel env vars (never paste it into an AI session)

### Vercel
- [ ] Backend project (root `backend/`): export the Express app for Vercel's Express support / serverless function; env: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`
- [ ] Frontend project (root `frontend/`): `vercel.json` rewrites `/api/:path*` → `https://<backend>.vercel.app/api/:path*` first, then the SPA fallback to `/index.html` so deep links (`/login`) don't 404
- [ ] Domain: add `incubyte.somvanshi.dev` to the **frontend** project → CNAME `incubyte` → `cname.vercel-dns.com` at name.com (or wherever nameservers point). The backend keeps its `*.vercel.app` URL; only the rewrite uses it
- [ ] Create the demo user (register through the UI); the demo admin comes from `seedAdmin`
- [ ] Smoke test live: register (auto-login), log in as the demo admin, add a vehicle, purchase until 0, button disables

---

## 7. Phase 5 — Documentation & Deliverables

### README.md
- [ ] Project overview + feature list
- [ ] Tech stack + **design decisions** (from section 0, incl. admin-only choices, quantity via purchase/restock)
- [ ] Architecture diagram / folder overview
- [ ] Local setup: prerequisites (Node, Docker), `.env` setup, `docker compose up` (dev + test DBs), migrate, seed admin, seed demo vehicles, run backend, run frontend (Vite proxies `/api`)
- [ ] How to run tests + coverage
- [ ] API endpoint table
- [ ] Screenshots (`docs/screenshots/`): login, inventory, search, sold-out card, admin form, mobile view — taken with the demo data
- [ ] Live link + demo logins (user and admin); say that anyone can change the demo data and `seedDemo` resets it
- [ ] Credits: Rayfield logo (Cyberpunk 2077 © CD PROJEKT RED; fan project) and the CodePen glitch effects (author + link)
- [ ] Note: tests use a real Postgres in Docker (tmpfs for speed); production uses Supabase — not an in-memory DB

### "My AI Usage" (mandatory)
- [ ] Tools: Claude Code (Opus) and the Claude planning chat — say where each ran; the list must match PROMPTS.md
- [ ] How: planning & test lists, scaffolding, writing tests, implementation, reviews — with concrete examples
- [ ] What I did: stack choice, decisions, reviewing every diff, edge cases I added, places AI was wrong and I corrected it
- [ ] Reflection: honest impact on speed, quality, learning TDD

### Other deliverables
- [ ] **PROMPTS.md**: raw logs of every AI session, no summaries — `/export` for Claude Code sessions (incl. the plan-review session), a public share link if the planning chat was on claude.ai. Logs are published unedited, so secrets must never enter a session
- [ ] **Test report**: `jest --coverage` output + `vitest --coverage`; commit a summary (e.g. `docs/test-report.md` with pasted output or screenshot); optionally `jest-html-reporter`
- [ ] Repo is **public**; the PDF and real env files never committed (`git log --all --name-only --format= | sort -u | grep -E 'pdf|\.env'` lists only `.env.example` and `.env.test`)

---

## 8. Git & Commit Conventions

```
test: add failing test for purchase when quantity is zero        ← RED
feat: return 409 when purchasing an out-of-stock vehicle         ← GREEN
refactor: move stock check into atomic repository update         ← REFACTOR
test: guard purchase auth (passes: router-level middleware)      ← GUARD
```

Commit body template:
```
feat: return 409 when purchasing an out-of-stock vehicle

AI: wrote the conditional UPDATE and the OutOfStockError mapping.
Me: reviewed the SQL, added the concurrency test case.


Co-authored-by: Claude <noreply@anthropic.com>
```
Put this exact trailer in CLAUDE.md; otherwise Claude Code appends its own (`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`). Git collapses the two blank lines into one; the trailer still parses.

Rules
- Red commit contains **only** the test (it fails). Green commit contains **only** what makes it pass.
- Guard tests (§4) pass on first run: check each fails when you briefly break the code, then commit it as `test: guard …` with the reason it passes.
- Refactor commit only if something genuinely improved.
- Other prefixes: `chore:` (tooling), `docs:`, `style:` (formatting), `ci:`.
- Co-author trailer on every AI-assisted commit; omit only if you truly wrote it alone.
- No pre-commit hook that runs tests or typecheck: it would block every red commit.
- Push at least at the end of every session.

---

## 9. Quality Gates (before every push)

- [ ] `npm test` green (backend + frontend)
- [ ] `npm run lint` and `npm run typecheck` clean
- [ ] No `console.log` leftovers, no commented-out code
- [ ] Exported functions and middleware have a short doc comment; comments explain *why*, not *what* (the assignment asks for meaningful comments)
- [ ] Optional: GitHub Actions running lint + tests on push (spins up Postgres service) — nice signal for reviewers

---
