import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { createPurchasesController } from './purchases.controller';
import type { PurchasesService } from './purchases.service';

/** Mounted at /api/purchases. Logged-in users only, and only ever their own purchases. */
export function createPurchasesRouter(service: PurchasesService): Router {
  const controller = createPurchasesController(service);
  const router = Router();
  router.use(authenticate);
  router.get('/me', controller.mine);
  return router;
}
