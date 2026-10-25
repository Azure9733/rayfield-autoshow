// Client-side copies of the backend's price-filter rules (searchQuerySchema), so a bad range
// shows under its field instead of coming back as a 400.
import type { SearchFilters } from '../api/vehicles';
import type { FieldErrors } from './types';

/** Messages for invalid price filters; blank filters are fine (they're left out). */
export function validateFilters(filters: Required<SearchFilters>): FieldErrors<SearchFilters> {
  const errors: FieldErrors<SearchFilters> = {};
  const min = filters.minPrice.trim() === '' ? undefined : Number(filters.minPrice);
  const max = filters.maxPrice.trim() === '' ? undefined : Number(filters.maxPrice);
  for (const [field, value] of [
    ['minPrice', min],
    ['maxPrice', max],
  ] as const) {
    if (value !== undefined && !(value >= 0)) errors[field] = 'Price filters must be 0 or more';
  }
  if (!errors.minPrice && !errors.maxPrice && min !== undefined && max !== undefined && min > max) {
    errors.minPrice = "Min price can't be more than max price";
  }
  return errors;
}
