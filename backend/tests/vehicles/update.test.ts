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

  it('moves updatedAt forward and leaves createdAt alone', async () => {
    const seededAt = new Date('2026-01-01T00:00:00Z');
    const { id } = await createVehicle({ createdAt: seededAt });

    const res = await putVehicle(id, replacement);

    expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(seededAt.getTime());
    expect(new Date(res.body.createdAt).getTime()).toBe(seededAt.getTime());
  });

  it.each([
    ['a missing make', { ...replacement, make: undefined }, 'make'],
    ['an invalid price', { ...replacement, price: 0 }, 'price'],
    ['an unknown category', { ...replacement, category: 'BOAT' }, 'category'],
  ])('returns 400 for %s, using the same rules as create', async (_case, body, field) => {
    const { id } = await createVehicle();

    const res = await putVehicle(id, body);

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ field, message: expect.any(String) }]);
  });

  it('clears the stored image when imageUrl is omitted (full replacement)', async () => {
    const { id } = await createVehicle({ imageUrl: 'https://example.com/old.jpg' });

    const res = await putVehicle(id, { ...replacement, imageUrl: undefined });

    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toBeNull();
  });

  it('ignores quantity in the body: stock only changes via purchase / restock', async () => {
    const { id } = await createVehicle({ quantity: 3 });

    const res = await putVehicle(id, { ...replacement, quantity: 99 });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(3);
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await putVehicle('00000000-0000-4000-8000-000000000000', replacement);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
