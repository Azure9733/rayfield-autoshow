import { within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { saveSession, type User } from '../api/session';
import type { Vehicle } from '../api/vehicles';
import { server } from './server';

/** Stores a session as if `role` had logged in. */
export function loginAs(role: User['role'] = 'user') {
  saveSession({
    token: `${role}.jwt.token`,
    user: {
      id: `${role}-1`,
      name: role === 'admin' ? 'Ada' : 'Vik',
      email: `${role}@example.com`,
      role,
    },
  });
}

/** A vehicle as the API returns it; override any field. */
export function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: '7f0c1a52-3c43-4d5e-9a49-1d2b6c1c0a11',
    make: 'Toyota',
    model: 'Land Cruiser',
    year: 2024,
    category: 'SUV',
    price: 125000,
    quantity: 3,
    imageUrl: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

export const inStock = makeVehicle({
  id: 'a1',
  make: 'Toyota',
  model: 'Land Cruiser',
  quantity: 2,
});
export const soldOut = makeVehicle({
  id: 'b2',
  make: 'Porsche',
  model: '911 Carrera',
  quantity: 0,
});

/** Makes GET /api/vehicles answer with these vehicles. */
export function serveVehicles(...vehicles: Vehicle[]) {
  server.use(http.get('/api/vehicles', () => HttpResponse.json(vehicles)));
}

/** The value next to a badge's label, e.g. badge(card, 'Stock') → the stock count element. */
export function badge(card: HTMLElement, label: string) {
  return within(card).getByText(label).nextElementSibling;
}
