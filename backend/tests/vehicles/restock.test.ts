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
});
