import request from 'supertest';
import { createApp } from '../../src/app';
import { DEMO_VEHICLES, seedDemo } from '../../src/scripts/seedDemo';
import { pool } from '../../src/db/client';
import { authHeader } from '../helpers/auth';
import { createPurchase } from '../helpers/purchases';
import { createUser } from '../helpers/users';
import { createVehicle } from '../helpers/vehicles';

describe('seedDemo', () => {
  it('replaces every vehicle with the sample set and is safe to re-run', async () => {
    const leftover = await createVehicle({ make: 'Leftover', model: 'Junk' });

    await seedDemo();
    await seedDemo();

    const res = await request(createApp()).get('/api/vehicles').set('Authorization', authHeader());
    const names = (list: { make: string; model: string }[]) =>
      list.map((v) => `${v.make} ${v.model}`).sort();
    expect(res.body.map((v: { id: string }) => v.id)).not.toContain(leftover.id);
    expect(names(res.body)).toEqual(names(DEMO_VEHICLES));
  });

  it('also deletes every purchase, so the demo garage starts empty', async () => {
    const buyer = await createUser();
    const { id: vehicleId } = await createVehicle();
    await createPurchase(buyer.id, { vehicleId });

    await seedDemo();

    const { rows } = await pool.query('select count(*)::int as n from purchases');
    expect(rows[0].n).toBe(0);
  });
});
