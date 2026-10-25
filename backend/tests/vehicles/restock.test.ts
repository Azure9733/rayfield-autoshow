import request from 'supertest';
import { createApp } from '../../src/app';
import { pool } from '../../src/db/client';
import { authHeader } from '../helpers/auth';
import { createVehicle } from '../helpers/vehicles';

function restock(id: string, body: Record<string, unknown>, role: 'admin' | 'user' = 'admin') {
  return request(createApp())
    .post(`/api/vehicles/${id}/restock`)
    .set('Authorization', authHeader(role))
    .send(body);
}

async function stockOf(id: string): Promise<number> {
  const { rows } = await pool.query<{ quantity: number }>(
    'select quantity from vehicles where id = $1',
    [id],
  );
  return rows[0].quantity;
}

describe('POST /api/vehicles/:id/restock', () => {
  it('adds stock for an admin and returns 200 with the updated vehicle', async () => {
    const { id } = await createVehicle({ quantity: 2 });

    const res = await restock(id, { quantity: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, quantity: 7 });
    expect(await stockOf(id)).toBe(7);
  });

  it('moves updatedAt forward: a stock change counts as an update', async () => {
    const seededAt = new Date('2026-01-01T00:00:00Z');
    const { id } = await createVehicle({ quantity: 2, createdAt: seededAt });

    const res = await restock(id, { quantity: 5 });

    expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(seededAt.getTime());
  });

  describe('quantity rule: integer from 1 to 10,000 per restock', () => {
    it.each([
      ['missing', undefined],
      ['zero', 0],
      ['negative', -1],
      ['a non-integer', 1.5],
      ['over 10,000', 10_001],
    ])('rejects a quantity that is %s with 400 and leaves stock alone', async (_case, quantity) => {
      const { id } = await createVehicle({ quantity: 2 });

      const res = await restock(id, { quantity });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([{ field: 'quantity', message: expect.any(String) }]);
      expect(await stockOf(id)).toBe(2);
    });

    it.each([1, 10_000])('accepts a quantity of %d', async (quantity) => {
      const { id } = await createVehicle({ quantity: 2 });

      const res = await restock(id, { quantity });

      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(2 + quantity);
    });
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await restock('00000000-0000-4000-8000-000000000000', { quantity: 5 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
