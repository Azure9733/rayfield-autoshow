import request from 'supertest';
import { createApp } from '../../src/app';
import { createPurchase } from '../helpers/purchases';
import { createUser } from '../helpers/users';
import { createVehicle } from '../helpers/vehicles';

function myPurchases(auth: string) {
  return request(createApp()).get('/api/purchases/me').set('Authorization', auth);
}

describe('GET /api/purchases/me', () => {
  it("returns the caller's purchases with the snapshot, price as a number", async () => {
    const me = await createUser();
    const vehicle = await createVehicle({ make: 'Toyota', model: 'Supra' });
    const purchasedAt = new Date('2026-10-25T15:11:00.000Z');
    const { id } = await createPurchase(me.id, {
      vehicleId: vehicle.id,
      make: 'Toyota',
      model: 'Supra',
      year: 2023,
      category: 'COUPE',
      price: 55000.5,
      createdAt: purchasedAt,
    });

    const res = await myPurchases(me.auth);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id,
        vehicleId: vehicle.id,
        make: 'Toyota',
        model: 'Supra',
        year: 2023,
        category: 'COUPE',
        price: 55000.5,
        purchasedAt: purchasedAt.toISOString(),
      },
    ]);
  });

  it('lists them newest first', async () => {
    const me = await createUser();
    const at = (iso: string) => ({ createdAt: new Date(iso) });
    // Inserted out of order, so the database's natural order can't pass by accident.
    const middle = await createPurchase(me.id, { model: 'Middle', ...at('2026-10-02T10:00:00Z') });
    const newest = await createPurchase(me.id, { model: 'Newest', ...at('2026-10-03T10:00:00Z') });
    const oldest = await createPurchase(me.id, { model: 'Oldest', ...at('2026-10-01T10:00:00Z') });

    const res = await myPurchases(me.auth);

    expect(res.body.map((p: { id: string }) => p.id)).toEqual([newest.id, middle.id, oldest.id]);
  });
});
