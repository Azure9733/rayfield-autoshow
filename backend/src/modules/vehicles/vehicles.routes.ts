import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import { validateBody, validateQuery } from '../../middleware/validate';
import { createVehiclesController } from './vehicles.controller';
import { createVehicleSchema, searchQuerySchema, updateVehicleSchema } from './vehicles.schemas';
import type { VehiclesService } from './vehicles.service';

/** Mounted at /api/vehicles. Every vehicle and inventory endpoint requires a logged-in user. */
export function createVehiclesRouter(service: VehiclesService): Router {
  const controller = createVehiclesController(service);
  const router = Router();
  router.use(authenticate);
  router.get('/', controller.list);
  router.get('/search', validateQuery(searchQuerySchema), controller.search);
  router.post('/', requireAdmin, validateBody(createVehicleSchema), controller.create);
  router.put('/:id', validateBody(updateVehicleSchema), controller.update);
  return router;
}
