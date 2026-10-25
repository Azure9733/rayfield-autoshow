import request from 'supertest';
import { createApp } from '../../src/app';
import { authHeader } from '../helpers/auth';
import { createVehicle } from '../helpers/vehicles';

function listVehicles() {
  return request(createApp()).get('/api/vehicles').set('Authorization', authHeader());
}

describe('GET /api/vehicles', () => {
  it('returns 200 with [] when there are no vehicles', async () => {
    const res = await listVehicles();

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns every vehicle with all its fields in camelCase', async () => {
    const corolla = await createVehicle({ imageUrl: 'https://example.com/corolla.jpg' });
    const ranger = await createVehicle({
      make: 'Ford',
      model: 'Ranger',
      year: 2023,
      category: 'TRUCK',
      price: 38999.99,
      quantity: 1,
    });

    const res = await listVehicles();

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    // price: anything here; its JSON type is pinned by the next test.
    expect(res.body).toEqual(
      expect.arrayContaining([
        {
          id: corolla.id,
          make: 'Toyota',
          model: 'Corolla',
          year: 2024,
          category: 'SEDAN',
          price: expect.anything(),
          quantity: 3,
          imageUrl: 'https://example.com/corolla.jpg',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        {
          id: ranger.id,
          make: 'Ford',
          model: 'Ranger',
          year: 2023,
          category: 'TRUCK',
          price: expect.anything(),
          quantity: 1,
          imageUrl: null,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      ]),
    );
  });

  it('returns price as a JSON number, not a string', async () => {
    await createVehicle({ price: 38999.99 });

    const res = await listVehicles();

    expect(res.body[0].price).toBe(38999.99);
  });
});
