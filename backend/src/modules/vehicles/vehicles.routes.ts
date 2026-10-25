import { Router } from 'express';

/** Mounted at /api/vehicles. */
export function createVehiclesRouter(): Router {
  const router = Router();
  router.get('/', (_req, res) => {
    res.json([]);
  });
  return router;
}
