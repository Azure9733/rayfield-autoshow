import { z } from 'zod';

const name = z.string().trim().min(1).max(50);

/** Request body for POST /api/vehicles. Unknown keys (e.g. a client-sent `id`) are stripped. */
export const createVehicleSchema = z.object({
  make: name,
  model: name,
  year: z.number(),
  category: z.string(),
  price: z.number(),
  quantity: z.number().optional(),
});
