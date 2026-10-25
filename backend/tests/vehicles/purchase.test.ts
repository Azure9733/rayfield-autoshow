import request from 'supertest';
import { createApp } from '../../src/app';
import { pool } from '../../src/db/client';
import { authHeader } from '../helpers/auth';
import { createVehicle } from '../helpers/vehicles';

function purchase(id: string) {
  return request(createApp())
    .post(`/api/vehicles/${id}/purchase`)
    .set('Authorization', authHeader('user'));
}

async function stockOf(id: string): Promise<number> {
  const { rows } = await pool.query<{ quantity: number }>(
    'select quantity from vehicles where id = $1',
    [id],
  );
  return rows[0].quantity;
}

describe('POST /api/vehicles/:id/purchase', () => {
  it('sells one unit to a logged-in user and returns 200 with the updated vehicle', async () => {
    const { id } = await createVehicle({ quantity: 3 });

    const res = await purchase(id);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, quantity: 2 });
    expect(await stockOf(id)).toBe(2);
  });

  it('returns 409 OUT_OF_STOCK when quantity is 0 and leaves stock at 0', async () => {
    const { id } = await createVehicle({ quantity: 0 });

    const res = await purchase(id);

    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({ code: 'OUT_OF_STOCK', message: 'Out of stock' });
    expect(await stockOf(id)).toBe(0);
  });
});
