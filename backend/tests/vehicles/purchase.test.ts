import request from 'supertest';
import { createApp } from '../../src/app';
import { pool } from '../../src/db/client';
import { createUser } from '../helpers/users';
import { createVehicle } from '../helpers/vehicles';

// A stored buyer: purchases reference users(id), so the token's user must exist.
let buyer: { id: string; auth: string };
beforeEach(async () => {
  buyer = await createUser();
});

function purchase(id: string) {
  return request(createApp()).post(`/api/vehicles/${id}/purchase`).set('Authorization', buyer.auth);
}

/** The purchase rows in the database, oldest first. */
async function purchaseRows() {
  const { rows } = await pool.query(
    `select user_id, vehicle_id, make, model, year, category, price
       from purchases order by created_at, id`,
  );
  return rows;
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

  it('records the purchase with the buyer and a snapshot of the vehicle', async () => {
    const { id } = await createVehicle({
      make: 'Toyota',
      model: 'Supra',
      year: 2023,
      category: 'COUPE',
      price: 55000.5,
      quantity: 2,
    });

    await purchase(id);

    expect(await purchaseRows()).toEqual([
      {
        user_id: buyer.id,
        vehicle_id: id,
        make: 'Toyota',
        model: 'Supra',
        year: 2023,
        category: 'COUPE',
        price: '55000.50',
      },
    ]);
  });

  it('returns 409 OUT_OF_STOCK when quantity is 0 and leaves stock at 0', async () => {
    const { id } = await createVehicle({ quantity: 0 });

    const res = await purchase(id);

    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({ code: 'OUT_OF_STOCK', message: 'Out of stock' });
    expect(await stockOf(id)).toBe(0);
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await purchase('00000000-0000-4000-8000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 400 for a malformed id', async () => {
    const res = await purchase('not-a-uuid');

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ field: 'id', message: expect.any(String) }]);
  });

  it('never oversells: 10 parallel purchases of 5 in stock give five 200s and five 409s', async () => {
    // Ten requests, not two: two might never overlap, so a race could go unnoticed.
    const { id } = await createVehicle({ quantity: 5 });

    const results = await Promise.all(Array.from({ length: 10 }, () => purchase(id)));
    const statuses = results.map((r) => r.status).sort();

    expect(statuses).toEqual([200, 200, 200, 200, 200, 409, 409, 409, 409, 409]);
    expect(await stockOf(id)).toBe(0);
  });

  it('returns 401 without a token and sells nothing', async () => {
    const { id } = await createVehicle({ quantity: 3 });

    const res = await request(createApp()).post(`/api/vehicles/${id}/purchase`);

    expect(res.status).toBe(401);
    expect(await stockOf(id)).toBe(3);
  });

  it('moves updatedAt forward: a stock change counts as an update', async () => {
    const seededAt = new Date('2026-01-01T00:00:00Z');
    const { id } = await createVehicle({ quantity: 3, createdAt: seededAt });

    const res = await purchase(id);

    expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(seededAt.getTime());
  });
});
