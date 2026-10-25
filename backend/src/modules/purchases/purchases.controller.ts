import type { Request, Response } from 'express';
import type { AuthUser } from '../../middleware/authenticate';
import type { PurchasesService } from './purchases.service';

/** Translates HTTP requests into purchases service calls and back; no business rules here. */
export function createPurchasesController(service: PurchasesService) {
  return {
    async mine(_req: Request, res: Response) {
      const caller = res.locals.user as AuthUser;
      res.json(await service.listMine(caller.id));
    },
  };
}
