import express, { type Express } from 'express';
import helmet from 'helmet';
import { db } from './db/client';
import { NotFoundError } from './lib/errors';
import { errorHandler } from './middleware/errorHandler';
import { createAuthRouter } from './modules/auth/auth.routes';
import { createAuthService } from './modules/auth/auth.service';
import { createUsersRepository, type UsersRepository } from './modules/auth/users.repository';
import {
  createVehiclesRepository,
  type VehiclesRepository,
} from './modules/vehicles/vehicles.repository';
import { createVehiclesRouter } from './modules/vehicles/vehicles.routes';
import { createVehiclesService } from './modules/vehicles/vehicles.service';

/** Everything the app needs from the outside world; tests can pass fakes (PLAN.md §1). */
export interface AppDeps {
  repos: { users: UsersRepository; vehicles: VehiclesRepository };
}

/** The real Postgres-backed dependencies. */
function defaultDeps(): AppDeps {
  return {
    repos: { users: createUsersRepository(db), vehicles: createVehiclesRepository(db) },
  };
}

/**
 * Builds the Express app without starting a server, so tests can drive it through
 * Supertest. Defaults to the real Postgres repositories.
 */
export function createApp({ repos }: AppDeps = defaultDeps()): Express {
  const app = express();
  // Security headers (nosniff, HSTS, CSP, frame options) and no X-Powered-By.
  app.use(helmet());
  app.use(express.json());

  // Liveness probe for local checks and the deploy smoke test; no DB access on purpose.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', createAuthRouter(createAuthService(repos.users)));
  app.use('/api/vehicles', createVehiclesRouter(createVehiclesService(repos.vehicles)));

  // No route matched. A path-less app.use, because Express 5 rejects app.all('*').
  app.use(() => {
    throw new NotFoundError('NOT_FOUND', 'Route not found');
  });

  // Registered last: Express treats 4-argument middleware as the error handler.
  app.use(errorHandler);

  return app;
}
