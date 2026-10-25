import express, { type Express } from 'express';
import { db } from './db/client';
import { errorHandler } from './middleware/errorHandler';
import { createAuthRouter } from './modules/auth/auth.routes';
import { createAuthService } from './modules/auth/auth.service';
import { createUsersRepository, type UsersRepository } from './modules/auth/users.repository';

/** Everything the app needs from the outside world; tests can pass fakes (PLAN.md §1). */
export interface AppDeps {
  repos: { users: UsersRepository };
}

/**
 * Builds the Express app without starting a server, so tests can drive it through
 * Supertest. Defaults to the real Postgres repositories.
 */
export function createApp(
  { repos }: AppDeps = { repos: { users: createUsersRepository(db) } },
): Express {
  const app = express();
  app.use(express.json());

  // Liveness probe for local checks and the deploy smoke test; no DB access on purpose.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', createAuthRouter(createAuthService(repos.users)));

  // Registered last: Express treats 4-argument middleware as the error handler.
  app.use(errorHandler);

  return app;
}
