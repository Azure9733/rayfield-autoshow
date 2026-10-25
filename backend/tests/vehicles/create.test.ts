import request from 'supertest';
import { createApp } from '../../src/app';
import { authHeader } from '../helpers/auth';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const validVehicle = {
  make: 'Toyota',
  model: 'Corolla',
  year: 2024,
  category: 'SEDAN',
  price: 25000,
  quantity: 3,
};

/** POSTs a vehicle as the given role, overriding fields of a valid body (`undefined` omits). */
function postVehicle(overrides: Record<string, unknown> = {}, role: 'admin' | 'user' = 'admin') {
  return request(createApp())
    .post('/api/vehicles')
    .set('Authorization', authHeader(role))
    .send({ ...validVehicle, ...overrides });
}

describe('POST /api/vehicles', () => {
  it('creates a vehicle for an admin and returns 201 with the generated id', async () => {
    const res = await postVehicle();

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.stringMatching(UUID),
      ...validVehicle,
      imageUrl: null,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });
});
