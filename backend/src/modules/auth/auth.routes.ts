import { Router } from 'express';
import { createAuthController } from './auth.controller';
import type { AuthService } from './auth.service';

/** Mounted at /api/auth. */
export function createAuthRouter(service: AuthService): Router {
  const controller = createAuthController(service);
  const router = Router();
  router.post('/register', controller.register);
  return router;
}
