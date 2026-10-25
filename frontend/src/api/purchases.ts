import type { Category } from '../constants/categories';
import { api } from './client';

/** A past purchase: a snapshot of the vehicle and what was paid (USD). */
export interface Purchase {
  /** The order id shown to the user. */
  id: string;
  /** null if the vehicle has since been deleted. */
  vehicleId: string | null;
  make: string;
  model: string;
  year: number;
  category: Category;
  price: number;
  /** ISO timestamp. */
  purchasedAt: string;
}

/** GET /api/purchases/me: the caller's purchases, newest first. */
export function listMyPurchases() {
  return api.get<Purchase[]>('/api/purchases/me');
}
