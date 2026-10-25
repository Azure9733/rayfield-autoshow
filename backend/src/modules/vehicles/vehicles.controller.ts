import type { Request, Response } from 'express';
import type { VehiclesService } from './vehicles.service';

/** Translates HTTP requests into vehicles service calls and back; no business rules here. */
export function createVehiclesController(service: VehiclesService) {
  return {
    async list(_req: Request, res: Response) {
      res.json(await service.list());
    },
  };
}
