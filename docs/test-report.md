# Test report

Generated on 2026-10-25 on the `feature/my-garage` branch (My Garage included). Re-create it with the commands below.

| | Tests | Lines | Branches | Functions | Statements |
|---|---|---|---|---|---|
| Backend (Jest + Supertest, real Postgres) | 216 passed, 24 suites | 99.09% | 97.1% | 98% | 99.14% |
| Frontend (Vitest + Testing Library + MSW) | 109 passed, 16 files | 96.48% | 89.38% | 96.27% | 94.98% |

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
- `frontend/src/components/SearchPanel.tsx`, `Header.tsx`, `lib/useModalClose.ts`: the animated close paths (keeping the panel or dialog mounted while its exit animation plays) only run with motion on.
- `backend/src/db/schema.ts` lines 69–71: the purchases foreign-key callbacks (`() => users.id`), which Drizzle only calls when generating migrations.
- `backend/src/modules/auth/users.repository.ts` line 74: rethrowing a database error that isn't a unique-email violation.

## Backend coverage (`npm run test:coverage`)

```
--------------------------|---------|----------|---------|---------|-------------------
File                      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
--------------------------|---------|----------|---------|---------|-------------------
All files                 |   99.14 |     97.1 |      98 |   99.09 |                   
 src                      |     100 |      100 |     100 |     100 |                   
  app.ts                  |     100 |      100 |     100 |     100 |                   
 src/config               |     100 |      100 |     100 |     100 |                   
  env.ts                  |     100 |      100 |     100 |     100 |                   
  envSchema.ts            |     100 |      100 |     100 |     100 |                   
 src/db                   |    90.9 |      100 |   71.42 |   90.47 |                   
  client.ts               |     100 |      100 |     100 |     100 |                   
  poolConfig.ts           |     100 |      100 |     100 |     100 |                   
  schema.ts               |   84.61 |      100 |   66.66 |   83.33 | 69-71             
 src/lib                  |     100 |      100 |     100 |     100 |                   
  errors.ts               |     100 |      100 |     100 |     100 |                   
  jwt.ts                  |     100 |      100 |     100 |     100 |                   
  password.ts             |     100 |      100 |     100 |     100 |                   
 src/middleware           |     100 |      100 |     100 |     100 |                   
  authenticate.ts         |     100 |      100 |     100 |     100 |                   
  errorHandler.ts         |     100 |      100 |     100 |     100 |                   
  requireAdmin.ts         |     100 |      100 |     100 |     100 |                   
  validate.ts             |     100 |      100 |     100 |     100 |                   
 src/modules/auth         |   98.24 |       90 |     100 |   98.21 |                   
  auth.controller.ts      |     100 |      100 |     100 |     100 |                   
  auth.routes.ts          |     100 |      100 |     100 |     100 |                   
  auth.schemas.ts         |     100 |      100 |     100 |     100 |                   
  auth.service.ts         |     100 |      100 |     100 |     100 |                   
  users.repository.ts     |   94.73 |       75 |     100 |   94.44 | 74                
 src/modules/purchases    |     100 |      100 |     100 |     100 |                   
  purchases.controller.ts |     100 |      100 |     100 |     100 |                   
  purchases.repository.ts |     100 |      100 |     100 |     100 |                   
  purchases.routes.ts     |     100 |      100 |     100 |     100 |                   
  purchases.service.ts    |     100 |      100 |     100 |     100 |                   
 src/modules/vehicles     |     100 |    97.29 |     100 |     100 |                   
  categories.ts           |     100 |      100 |     100 |     100 |                   
  vehicles.controller.ts  |     100 |      100 |     100 |     100 |                   
  vehicles.repository.ts  |     100 |    95.45 |     100 |     100 | 152               
  vehicles.routes.ts      |     100 |      100 |     100 |     100 |                   
  vehicles.schemas.ts     |     100 |      100 |     100 |     100 |                   
  vehicles.service.ts     |     100 |      100 |     100 |     100 |                   
 src/scripts              |     100 |      100 |     100 |     100 |                   
  seedAdmin.ts            |     100 |      100 |     100 |     100 |                   
  seedDemo.ts             |     100 |      100 |     100 |     100 |                   
--------------------------|---------|----------|---------|---------|-------------------
```

## Frontend coverage (`npm run test:coverage`)

The text reporter lists only files below 100%; the summary row covers all of `src` (test helpers, test files and `main.tsx` excluded).

```
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   94.98 |    89.38 |   96.27 |   96.48 |                   
 src/api           |     100 |    93.54 |     100 |     100 |                   
  client.ts        |     100 |    95.23 |     100 |     100 | 30                
  vehicles.ts      |     100 |       75 |     100 |     100 | 49                
 src/components    |   93.36 |    87.57 |   93.18 |   94.23 |                   
  BootSplash.tsx   |     100 |       85 |     100 |     100 | 28,61-64          
  GarageDialog.tsx |   95.83 |    78.57 |     100 |     100 | 24-28             
  Header.tsx       |   94.87 |    86.95 |     100 |   93.93 | 37-39             
  LoginSweep.tsx   |   33.33 |       50 |      20 |   33.33 | 16-25             
  Modal.tsx        |     100 |       80 |     100 |     100 | 30,47             
  ...aseDialog.tsx |     100 |    93.75 |     100 |     100 | 49                
  SearchPanel.tsx  |   88.88 |    82.35 |      90 |   86.95 | 60-63,73          
  Toast.tsx        |     100 |       75 |     100 |     100 | 17-18             
  VehicleCard.tsx  |   93.75 |      100 |      90 |   93.33 | 105               
  ...FormModal.tsx |   96.55 |     92.3 |     100 |     100 | 58                
 src/context       |   96.29 |       75 |     100 |     100 |                   
  AuthContext.tsx  |   96.29 |       75 |     100 |     100 | 94                
 src/lib           |   88.46 |       50 |     100 |   86.36 |                   
  motion.ts        |     100 |       50 |     100 |     100 | 6                 
  useModalClose.ts |   78.57 |       50 |     100 |      75 | 23-26             
 src/pages         |   95.17 |    84.61 |   97.72 |   99.16 |                   
  ...ntoryPage.tsx |   95.19 |    86.44 |   97.22 |    98.8 | 263               
  LoginPage.tsx    |   93.75 |       50 |     100 |     100 | 24                
  RegisterPage.tsx |   95.83 |       75 |     100 |     100 | 40                
 src/validation    |   98.03 |      100 |     100 |   97.82 |                   
  vehicle.ts       |   96.42 |      100 |     100 |   96.29 | 29                
-------------------|---------|----------|---------|---------|-------------------
```
