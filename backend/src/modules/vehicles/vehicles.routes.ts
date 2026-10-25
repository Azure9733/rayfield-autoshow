import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { createVehiclesController } from './vehicles.controller';
import type { VehiclesService } from './vehicles.service';

/** Mounted at /api/vehicles. Every vehicle and inventory endpoint requires a logged-in user. */
export function createVehiclesRouter(service: VehiclesService): Router {
  const controller = createVehiclesController(service);
  const router = Router();
  router.use(authenticate);
  router.get('/', controller.list);
  return router;
}
