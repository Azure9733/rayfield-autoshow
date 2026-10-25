import express, { type Express } from 'express';

/**
 * Builds the Express app without starting a server, so tests can drive it through
 * Supertest. Repositories will be injected here once they exist (PLAN.md §1).
 */
export function createApp(): Express {
  const app = express();
  app.use(express.json());

  // Liveness probe for local checks and the deploy smoke test; no DB access on purpose.
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
