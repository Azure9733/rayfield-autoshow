// Single source of the vehicle categories for the backend (DB check, validation).
// The frontend keeps a copy in frontend/src/constants/categories.ts: keep them in sync.
export const CATEGORIES = [
  'SEDAN',
  'SUV',
  'HATCHBACK',
  'COUPE',
  'CONVERTIBLE',
  'TRUCK',
  'VAN',
] as const;

export type Category = (typeof CATEGORIES)[number];
