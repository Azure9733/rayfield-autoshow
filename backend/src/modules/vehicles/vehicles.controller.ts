import type { Request, Response } from 'express';
import type { NewVehicle, VehicleFilters, VehicleUpdate } from './vehicles.repository';
import type { VehiclesService } from './vehicles.service';

/** Translates HTTP requests into vehicles service calls and back; no business rules here. */
export function createVehiclesController(service: VehiclesService) {
  return {
    async list(_req: Request, res: Response) {
      res.json(await service.list());
    },

    async search(_req: Request, res: Response) {
      res.json(await service.search(res.locals.query as VehicleFilters));
    },

    async create(_req: Request, res: Response) {
      res.status(201).json(await service.create(res.locals.body as NewVehicle));
    },

    async update(req: Request<{ id: string }>, res: Response) {
      res.json(await service.update(req.params.id, res.locals.body as VehicleUpdate));
    },

    async remove(req: Request<{ id: string }>, res: Response) {
      await service.remove(req.params.id);
      res.status(204).end();
    },
  };
}
