import { z } from 'zod';
import { CATEGORIES } from './categories';

// Each field uses one plain-English message for every way it can be wrong (missing, wrong
// type, out of range); the UI shows it under the matching form field.

/** Make or model: trimmed, 1–50 characters. */
function nameField(label: string) {
  const message = `${label} must be 1–50 characters`;
  return z.string({ error: message }).trim().min(1, message).max(50, message);
}

const categoryMessage = `Category must be one of: ${CATEGORIES.join(', ')}`;

/** Case-insensitive category: trimmed and uppercased, then checked against the list. */
export const categorySchema = z
  .string({ error: categoryMessage })
  .trim()
  .toUpperCase()
  .pipe(z.enum(CATEGORIES, { error: categoryMessage }));

/**
 * An optional query filter where an empty string (a blank form field) counts as absent.
 * Without this, "" would fail the category check and coerce to 0 for prices.
 */
function optionalFilter<T extends z.ZodType>(schema: T) {
  return z.preprocess((value) => (value === '' ? undefined : value), schema.optional());
}

const priceFilterMessage = 'Price filters must be 0 or more';

// Query values arrive as strings; coerce turns "25000" into 25000 (and "abc" into a 400).
const priceFilter = z.coerce.number({ error: priceFilterMessage }).nonnegative(priceFilterMessage);

/** Query string for GET /api/vehicles/search; every filter is optional. */
export const searchQuerySchema = z
  .object({
    q: optionalFilter(z.string()),
    make: optionalFilter(z.string()),
    model: optionalFilter(z.string()),
    category: optionalFilter(categorySchema),
    minPrice: optionalFilter(priceFilter),
    maxPrice: optionalFilter(priceFilter),
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    { path: ['minPrice'], message: "Min price can't be more than max price" },
  );

/** Built per validation (not at startup), so the year in the message rolls over on 1 January. */
const lastValidYear = () => new Date().getFullYear() + 1;
const yearError = { error: () => `Year must be a whole number from 1900 to ${lastValidYear()}` };
const priceMessage = 'Price must be between $0.01 and $100,000,000, with up to 2 decimals';
const quantityMessage = 'Quantity must be a whole number from 0 to 10,000';
const imageUrlMessage = 'Image URL must be a valid https:// address';

/** Request body for POST /api/vehicles. Unknown keys (e.g. a client-sent `id`) are stripped. */
export const createVehicleSchema = z.object({
  make: nameField('Make'),
  model: nameField('Model'),
  // The upper bound is computed per request, not at startup, so it rolls over on 1 January.
  year: z
    .number(yearError)
    .int(yearError)
    .min(1900, yearError)
    .refine((y) => y <= lastValidYear(), yearError),
  category: categorySchema,
  // multipleOf uses a float-safe remainder, so 19.99 passes (19.99 * 100 isn't an integer in JS).
  price: z
    .number({ error: priceMessage })
    .positive(priceMessage)
    .max(100_000_000, priceMessage)
    .multipleOf(0.01, priceMessage),
  quantity: z
    .number({ error: quantityMessage })
    .int(quantityMessage)
    .min(0, quantityMessage)
    .max(10_000, quantityMessage)
    .optional(),
  imageUrl: z.url({ protocol: /^https$/, error: imageUrlMessage }).optional(),
});

/**
 * Request body for PUT /api/vehicles/:id: a full replacement with the same rules as create,
 * minus quantity (stock only changes through purchase / restock; a sent quantity is stripped).
 */
export const updateVehicleSchema = createVehicleSchema.omit({ quantity: true });

const restockMessage = 'Restock quantity must be a whole number from 1 to 10,000';

/** Request body for POST /api/vehicles/:id/restock: units to add, 1–10,000 per call. */
export const restockSchema = z.object({
  quantity: z
    .number({ error: restockMessage })
    .int(restockMessage)
    .min(1, restockMessage)
    .max(10_000, restockMessage),
});
