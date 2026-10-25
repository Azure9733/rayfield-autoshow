import type { Category } from '../constants/categories';
import { api } from './client';

/** A vehicle as the API returns it (price is always a number, in USD). */
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  category: Category;
  price: number;
  quantity: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /api/vehicles: every vehicle, newest first, sold-out ones included. */
export function listVehicles() {
  return api.get<Vehicle[]>('/api/vehicles');
}

/** POST /api/vehicles/:id/purchase: buys one unit; returns the updated vehicle. */
export function purchaseVehicle(id: string) {
  return api.post<Vehicle>(`/api/vehicles/${id}/purchase`);
}
