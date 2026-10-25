import request from 'supertest';
import { createApp } from '../../src/app';
import { DEMO_VEHICLES, seedDemo } from '../../src/scripts/seedDemo';
import { authHeader } from '../helpers/auth';
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
});
