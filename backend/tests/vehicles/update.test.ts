import request from 'supertest';
import { createApp } from '../../src/app';
import { authHeader } from '../helpers/auth';
import { createVehicle } from '../helpers/vehicles';

/** A complete replacement body (PUT replaces every editable field). */
const replacement = {
  make: 'Honda',
  model: 'Civic',
  year: 2023,
  category: 'HATCHBACK',
  price: 21000,
  imageUrl: 'https://example.com/civic.jpg',
};

/** PUTs a body to /api/vehicles/:id as the given role. */
function putVehicle(id: string, body: Record<string, unknown>, role: 'admin' | 'user' = 'admin') {
  return request(createApp())
    .put(`/api/vehicles/${id}`)
    .set('Authorization', authHeader(role))
    .send(body);
}

describe('PUT /api/vehicles/:id', () => {
  it('replaces the vehicle and returns 200 with the updated vehicle', async () => {
    const { id } = await createVehicle({ quantity: 3 });

    const res = await putVehicle(id, replacement);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id,
      ...replacement,
      quantity: 3,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });
});
