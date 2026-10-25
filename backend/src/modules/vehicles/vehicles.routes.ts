import { Router } from 'express';
import { createVehiclesController } from './vehicles.controller';
import type { VehiclesService } from './vehicles.service';

/** Mounted at /api/vehicles. */
export function createVehiclesRouter(service: VehiclesService): Router {
  const controller = createVehiclesController(service);
  const router = Router();
  router.get('/', controller.list);
  return router;
}
