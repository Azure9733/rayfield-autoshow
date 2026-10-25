import type { Category } from '../constants/categories';

// Side profiles on a 64×32 grid. Every body starts at x=4 and ends at x=60 so the shared
// sill line and wheels below line up for all of them.
const BODIES: Record<Category, string> = {
  SEDAN: 'M4 24V19l7-2 8-6h21l9 6 11 2v5',
  SUV: 'M4 24V15l4-2 6-7h36l4 7 6 2v9',
  HATCHBACK: 'M4 24v-6l8-2 8-6h22l10 8 8 1v5',
  COUPE: 'M4 24v-5l9-2 10-6h14l13 7 10 2v4',
  CONVERTIBLE: 'M4 24v-6l17-1h37l2 2v5M21 17l4-5',
  TRUCK: 'M4 24V14h6l4-7h14v8h32v9',
  VAN: 'M4 24V9q0-3 3-3h45l8 8v10',
};

/** Line-art vehicle silhouette for a category; the card's fallback when there's no image. */
export function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      data-testid="category-icon"
    >
      <path d={BODIES[category]} />
      <path d="M4 24h7M21 24h22M53 24h7" />
      <circle cx="16" cy="24" r="5" />
      <circle cx="48" cy="24" r="5" />
    </svg>
  );
}
