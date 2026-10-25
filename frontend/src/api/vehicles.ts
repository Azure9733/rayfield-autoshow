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

/** Search form values; every field is optional, and blank ones are left out of the request. */
export interface SearchFilters {
  /** Part of the make or the model (the search bar). */
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
}

/** A cleared search form. */
export const EMPTY_FILTERS: Required<SearchFilters> = {
  q: '',
  category: '',
  minPrice: '',
  maxPrice: '',
};

/** The filters with blank (or whitespace-only) values removed, trimmed. */
export function filledFilters(filters: SearchFilters): SearchFilters {
  return Object.fromEntries(
    Object.entries(filters)
      .map(([key, value]) => [key, value?.trim() ?? ''])
      .filter(([, value]) => value !== ''),
  );
}

/** The search filters in a URL query string (unknown params ignored, missing ones blank). */
export function filtersFromParams(params: URLSearchParams): Required<SearchFilters> {
  return Object.fromEntries(
    Object.keys(EMPTY_FILTERS).map((key) => [key, params.get(key) ?? '']),
  ) as Required<SearchFilters>;
}

/** GET /api/vehicles/search with only the filled filters as query params. */
export function searchVehicles(filters: SearchFilters) {
  const params = new URLSearchParams(filledFilters(filters) as Record<string, string>);
  return api.get<Vehicle[]>(`/api/vehicles/search?${params}`);
}

/** Body for POST /api/vehicles (with quantity) and PUT /api/vehicles/:id (without). */
export interface VehicleInput {
  make: string;
  model: string;
  year: number;
  category: string;
  price: number;
  imageUrl?: string;
  quantity?: number;
}

/** POST /api/vehicles (admin): returns the created vehicle. */
export function createVehicle(input: VehicleInput) {
  return api.post<Vehicle>('/api/vehicles', input);
}

/** PUT /api/vehicles/:id (admin): full replacement of the editable fields (no quantity). */
export function updateVehicle(id: string, input: VehicleInput) {
  return api.put<Vehicle>(`/api/vehicles/${id}`, input);
}

/** DELETE /api/vehicles/:id (admin). */
export function deleteVehicle(id: string) {
  return api.delete(`/api/vehicles/${id}`);
}

/** POST /api/vehicles/:id/restock (admin): adds 1–10,000 units; returns the updated vehicle. */
export function restockVehicle(id: string, quantity: number) {
  return api.post<Vehicle>(`/api/vehicles/${id}/restock`, { quantity });
}
