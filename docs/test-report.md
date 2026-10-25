# Test report

Generated on 2026-10-25 from commit `91408bb` on `main`. Re-create it with the commands below.

| | Tests | Lines | Branches | Functions | Statements |
|---|---|---|---|---|---|
| Backend (Jest + Supertest, real Postgres) | 206 passed, 23 suites | 99.65% | 97.05% | 100% | 99.67% |
| Frontend (Vitest + Testing Library + MSW) | 101 passed, 15 files | 96.81% | 90.15% | 95.88% | 95.28% |

The backend enforces a 90% line threshold in `jest.config.mjs`: `npm run test:coverage` fails below it.

## How to reproduce

```bash
# Backend: needs the Docker test database (npm run db:up)
cd backend && npm run test:coverage

# Frontend: no backend needed (MSW mocks the API)
cd frontend && npm run test:coverage
```

## What the tests run against

- **Backend:** HTTP-level tests through Supertest against a real Postgres 17 in Docker (`db-test`, port 5433), not an in-memory database. Its data lives in RAM (tmpfs) with fsync off, so the suite runs in about 5 seconds. Global setup wipes and re-migrates it once per run; each test starts with empty tables. A few unit tests (password hashing, JWT, auth service timing, env and pool config) need no database.
- **Frontend:** components and pages rendered in jsdom with React Testing Library and user-event; the API is mocked at the network level with MSW, so the real fetch client runs. Tests run as if the user prefers reduced motion (animations finish instantly); the boot-splash test switches that off to check its timeline with fake timers.

## Where coverage is lower, and why

- `frontend/src/components/LoginSweep.tsx` (33% lines): the post-login wipe is pure animation and renders nothing under reduced motion, which the tests use.
- `frontend/src/components/SearchPanel.tsx`, `Header.tsx`: the animated close paths (keeping the panel mounted while the wipe plays) only run with motion on.
- `backend/src/modules/auth/users.repository.ts` line 74: rethrowing a database error that isn't a unique-email violation.

## Backend coverage (`npm run test:coverage`)

```
-------------------------|---------|----------|---------|---------|-------------------
File                     | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------------|---------|----------|---------|---------|-------------------
All files                |   99.67 |    97.05 |     100 |   99.65 |                   
 src                     |     100 |      100 |     100 |     100 |                   
  app.ts                 |     100 |      100 |     100 |     100 |                   
 src/config              |     100 |      100 |     100 |     100 |                   
  env.ts                 |     100 |      100 |     100 |     100 |                   
  envSchema.ts           |     100 |      100 |     100 |     100 |                   
 src/db                  |     100 |      100 |     100 |     100 |                   
  client.ts              |     100 |      100 |     100 |     100 |                   
  poolConfig.ts          |     100 |      100 |     100 |     100 |                   
  schema.ts              |     100 |      100 |     100 |     100 |                   
 src/lib                 |     100 |      100 |     100 |     100 |                   
  errors.ts              |     100 |      100 |     100 |     100 |                   
  jwt.ts                 |     100 |      100 |     100 |     100 |                   
  password.ts            |     100 |      100 |     100 |     100 |                   
 src/middleware          |     100 |      100 |     100 |     100 |                   
  authenticate.ts        |     100 |      100 |     100 |     100 |                   
  errorHandler.ts        |     100 |      100 |     100 |     100 |                   
  requireAdmin.ts        |     100 |      100 |     100 |     100 |                   
  validate.ts            |     100 |      100 |     100 |     100 |                   
 src/modules/auth        |   98.24 |       90 |     100 |   98.21 |                   
  auth.controller.ts     |     100 |      100 |     100 |     100 |                   
  auth.routes.ts         |     100 |      100 |     100 |     100 |                   
  auth.schemas.ts        |     100 |      100 |     100 |     100 |                   
  auth.service.ts        |     100 |      100 |     100 |     100 |                   
  users.repository.ts    |   94.73 |       75 |     100 |   94.44 | 74                
 src/modules/vehicles    |     100 |    97.29 |     100 |     100 |                   
  categories.ts          |     100 |      100 |     100 |     100 |                   
  vehicles.controller.ts |     100 |      100 |     100 |     100 |                   
  vehicles.repository.ts |     100 |    95.45 |     100 |     100 | 143               
  vehicles.routes.ts     |     100 |      100 |     100 |     100 |                   
  vehicles.schemas.ts    |     100 |      100 |     100 |     100 |                   
  vehicles.service.ts    |     100 |      100 |     100 |     100 |                   
 src/scripts             |     100 |      100 |     100 |     100 |                   
  seedAdmin.ts           |     100 |      100 |     100 |     100 |                   
  seedDemo.ts            |     100 |      100 |     100 |     100 |                   
-------------------------|---------|----------|---------|---------|-------------------
```

## Frontend coverage (`npm run test:coverage`)

The text reporter lists only files below 100%; the summary row covers all of `src` (test helpers, test files and `main.tsx` excluded).

```
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   95.28 |    90.15 |   95.88 |   96.81 |                   
 src/api           |     100 |    93.54 |     100 |     100 |                   
  client.ts        |     100 |    95.23 |     100 |     100 | 30                
  vehicles.ts      |     100 |       75 |     100 |     100 | 49                
 src/components    |   92.82 |    88.43 |      92 |   93.33 |                   
  BootSplash.tsx   |     100 |       85 |     100 |     100 | 28,61-64          
  Header.tsx       |   94.11 |    85.71 |     100 |   92.85 | 35-37             
  LoginSweep.tsx   |   33.33 |       50 |      20 |   33.33 | 16-25             
  ...aseDialog.tsx |     100 |       90 |     100 |     100 | 45,62             
  SearchPanel.tsx  |   88.88 |    82.35 |      90 |   86.95 | 60-63,73          
  Toast.tsx        |     100 |       75 |     100 |     100 | 17-18             
  VehicleCard.tsx  |   93.75 |      100 |      90 |   93.33 | 105               
  ...FormModal.tsx |   96.55 |     92.3 |     100 |     100 | 58                
 src/context       |   96.29 |       75 |     100 |     100 |                   
  AuthContext.tsx  |   96.29 |       75 |     100 |     100 | 94                
 src/lib           |     100 |       50 |     100 |     100 |                   
  motion.ts        |     100 |       50 |     100 |     100 | 6                 
 src/pages         |   95.17 |    84.61 |   97.72 |   99.16 |                   
  ...ntoryPage.tsx |   95.19 |    86.44 |   97.22 |    98.8 | 263               
  LoginPage.tsx    |   93.75 |       50 |     100 |     100 | 24                
  RegisterPage.tsx |   95.83 |       75 |     100 |     100 | 40                
 src/validation    |   98.03 |      100 |     100 |   97.82 |                   
  vehicle.ts       |   96.42 |      100 |     100 |   96.29 | 29                
-------------------|---------|----------|---------|---------|-------------------
```
