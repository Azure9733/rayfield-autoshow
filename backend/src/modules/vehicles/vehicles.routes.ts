import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import { validateBody } from '../../middleware/validate';
import { createVehiclesController } from './vehicles.controller';
import { createVehicleSchema } from './vehicles.schemas';
import type { VehiclesService } from './vehicles.service';

/** Mounted at /api/vehicles. Every vehicle and inventory endpoint requires a logged-in user. */
export function createVehiclesRouter(service: VehiclesService): Router {
  const controller = createVehiclesController(service);
  const router = Router();
  router.use(authenticate);
  router.get('/', controller.list);
  router.get('/search', controller.search);
  router.post('/', requireAdmin, validateBody(createVehicleSchema), controller.create);
  return router;
}
