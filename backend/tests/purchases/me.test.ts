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
});
