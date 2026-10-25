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

  it('matches part of the make', async () => {
    const toyota = await createVehicle({ make: 'Toyota' });
    await createVehicle({ make: 'Ford' });

    const res = await search({ make: 'yot' });

    expect(idsOf(res)).toEqual([toyota.id]);
  });

  it('filters by part of the model, case-insensitively', async () => {
    const corolla = await createVehicle({ make: 'Toyota', model: 'Corolla' });
    await createVehicle({ make: 'Toyota', model: 'Camry' });

    const res = await search({ model: 'COR' });

    expect(idsOf(res)).toEqual([corolla.id]);
  });

  // In SQL LIKE, % matches anything and _ matches any one character; user input must not.
  it.each(['%', '_'])('treats %s in the search text literally', async (wildcard) => {
    await createVehicle({ make: 'Toyota', model: 'Corolla' });
    const literal = await createVehicle({
      make: `Make${wildcard}One`,
      model: `Model${wildcard}One`,
    });

    const byMake = await search({ make: wildcard });
    const byModel = await search({ model: wildcard });

    expect(idsOf(byMake)).toEqual([literal.id]);
    expect(idsOf(byModel)).toEqual([literal.id]);
  });

  it('filters by category, case-insensitively', async () => {
    const suv = await createVehicle({ category: 'SUV' });
    await createVehicle({ category: 'SEDAN' });

    const res = await search({ category: 'suv' });

    expect(idsOf(res)).toEqual([suv.id]);
  });

  it('returns 400 for an unknown category', async () => {
    const res = await search({ category: 'BOAT' });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ field: 'category', message: expect.any(String) }]);
  });
});
