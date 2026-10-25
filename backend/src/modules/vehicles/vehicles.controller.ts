import type { Request, Response } from 'express';
import type { NewVehicle } from './vehicles.repository';
import type { VehiclesService } from './vehicles.service';

/** Translates HTTP requests into vehicles service calls and back; no business rules here. */
export function createVehiclesController(service: VehiclesService) {
  return {
    async list(_req: Request, res: Response) {
      res.json(await service.list());
    },

    async create(_req: Request, res: Response) {
      res.status(201).json(await service.create(res.locals.body as NewVehicle));
    },
  };
}
