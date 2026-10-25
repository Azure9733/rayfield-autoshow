import { z } from 'zod';
import { CATEGORIES } from './categories';

const name = z.string().trim().min(1).max(50);

/** Case-insensitive category: trimmed and uppercased, then checked against the list. */
export const categorySchema = z.string().trim().toUpperCase().pipe(z.enum(CATEGORIES));

/** Request body for POST /api/vehicles. Unknown keys (e.g. a client-sent `id`) are stripped. */
export const createVehicleSchema = z.object({
  make: name,
  model: name,
  // The upper bound is computed per request, not at startup, so it rolls over on 1 January.
  year: z
    .number()
    .int()
    .min(1900)
    .refine((y) => y <= new Date().getFullYear() + 1, 'Year must be no later than next year'),
  category: categorySchema,
  // multipleOf uses a float-safe remainder, so 19.99 passes (19.99 * 100 isn't an integer in JS).
  price: z.number().positive().max(100_000_000).multipleOf(0.01),
  quantity: z.number().int().min(0).max(10_000).optional(),
});
