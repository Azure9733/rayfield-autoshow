import { z } from 'zod';
import { CATEGORIES } from './categories';

const name = z.string().trim().min(1).max(50);

/** Case-insensitive category: trimmed and uppercased, then checked against the list. */
export const categorySchema = z.string().trim().toUpperCase().pipe(z.enum(CATEGORIES));

/** Request body for POST /api/vehicles. Unknown keys (e.g. a client-sent `id`) are stripped. */
export const createVehicleSchema = z.object({
  make: name,
  model: name,
  year: z.number(),
  category: categorySchema,
  price: z.number(),
  quantity: z.number().optional(),
});
