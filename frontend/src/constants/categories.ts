// Copy of backend/src/modules/vehicles/categories.ts for the vehicle form and search dropdowns.
// There's no shared package between backend/ and frontend/: keep the two lists in sync.
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
