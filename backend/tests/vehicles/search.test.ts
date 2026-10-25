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

  it('treats minPrice as an inclusive lower bound', async () => {
    await createVehicle({ price: 24999.99 });
    const atMin = await createVehicle({ price: 25000 });
    const above = await createVehicle({ price: 30000 });

    const res = await search({ minPrice: '25000' });

    expect(idsOf(res)).toEqual([atMin.id, above.id].sort());
  });

  it('treats maxPrice as an inclusive upper bound', async () => {
    const below = await createVehicle({ price: 20000 });
    const atMax = await createVehicle({ price: 30000 });
    await createVehicle({ price: 30000.01 });

    const res = await search({ maxPrice: '30000' });

    expect(idsOf(res)).toEqual([below.id, atMax.id].sort());
  });

  it.each([
    ['make + maxPrice', { make: 'Toyota', maxPrice: '30000' }],
    ['minPrice + maxPrice', { minPrice: '25000', maxPrice: '30000' }],
  ])('combines filters with AND (%s)', async (_case, query) => {
    const match = await createVehicle({ make: 'Toyota', price: 27000 });
    await createVehicle({ make: 'Toyota', price: 45000 }); // fails the price filter
    await createVehicle({ make: 'Ford', price: 20000 }); // fails make / minPrice

    const res = await search(query);

    expect(idsOf(res)).toEqual([match.id]);
  });

  it('returns every vehicle when no filters are given', async () => {
    const a = await createVehicle({ make: 'Toyota' });
    const b = await createVehicle({ make: 'Ford' });

    const res = await search();

    expect(res.status).toBe(200);
    expect(idsOf(res)).toEqual([a.id, b.id].sort());
  });

  it('returns 200 with [] when nothing matches', async () => {
    await createVehicle({ make: 'Toyota' });

    const res = await search({ make: 'Lamborghini' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // A search form submits blank fields as empty strings; they must mean "no filter".
  it.each(['make', 'model', 'category', 'minPrice', 'maxPrice'])(
    'treats an empty %s as absent',
    async (param) => {
      const a = await createVehicle({ make: 'Toyota', price: 25000 });
      const b = await createVehicle({ make: 'Ford', price: 30000 });

      const res = await search({ [param]: '' });

      expect(res.status).toBe(200);
      expect(idsOf(res)).toEqual([a.id, b.id].sort());
    },
  );

  it('returns 400 when minPrice is greater than maxPrice', async () => {
    const res = await search({ minPrice: '30000', maxPrice: '20000' });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ field: 'minPrice', message: expect.any(String) }]);
  });
});
