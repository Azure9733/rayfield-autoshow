import { Router } from 'express';
import { validateBody } from '../../middleware/validate';
import { createAuthController } from './auth.controller';
import { registerSchema } from './auth.schemas';
import type { AuthService } from './auth.service';

/** Mounted at /api/auth. */
export function createAuthRouter(service: AuthService): Router {
  const controller = createAuthController(service);
  const router = Router();
  router.post('/register', validateBody(registerSchema), controller.register);
  router.post('/login', controller.login);
  return router;
}
