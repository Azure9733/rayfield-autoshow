import request from 'supertest';
import { createApp } from '../../src/app';
import { authHeader } from '../helpers/auth';
import { createVehicle } from '../helpers/vehicles';

function search(query: Record<string, string> = {}) {
  return request(createApp())
    .get('/api/vehicles/search')
    .query(query)
    .set('Authorization', authHeader());
}

/** The ids in a search response, for order-insensitive comparisons. */
function idsOf(res: { body: { id: string }[] }): string[] {
  return res.body.map((v) => v.id).sort();
}

describe('GET /api/vehicles/search', () => {
  it('filters by make', async () => {
    const toyota = await createVehicle({ make: 'Toyota', model: 'Corolla' });
    await createVehicle({ make: 'Ford', model: 'Ranger' });

    const res = await search({ make: 'Toyota' });

    expect(res.status).toBe(200);
    expect(idsOf(res)).toEqual([toyota.id]);
  });

  it('matches make case-insensitively', async () => {
    const toyota = await createVehicle({ make: 'Toyota' });

    const res = await search({ make: 'tOYOTA' });

    expect(idsOf(res)).toEqual([toyota.id]);
  });
});
