import { z } from 'zod';

/** Request body for POST /api/vehicles. Unknown keys (e.g. a client-sent `id`) are stripped. */
export const createVehicleSchema = z.object({
  make: z.string(),
  model: z.string(),
  year: z.number(),
  category: z.string(),
  price: z.number(),
  quantity: z.number().optional(),
});
