import request from 'supertest';
import { createApp } from '../../src/app';
import { authHeader } from '../helpers/auth';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const validVehicle = {
  make: 'Toyota',
  model: 'Corolla',
  year: 2024,
  category: 'SEDAN',
  price: 25000,
  quantity: 3,
};

/** POSTs a vehicle as the given role, overriding fields of a valid body (`undefined` omits). */
function postVehicle(overrides: Record<string, unknown> = {}, role: 'admin' | 'user' = 'admin') {
  return request(createApp())
    .post('/api/vehicles')
    .set('Authorization', authHeader(role))
    .send({ ...validVehicle, ...overrides });
}

describe('POST /api/vehicles', () => {
  it('creates a vehicle for an admin and returns 201 with the generated id', async () => {
    const res = await postVehicle();

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.stringMatching(UUID),
      ...validVehicle,
      imageUrl: null,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('persists the vehicle, so a follow-up GET /api/vehicles finds it', async () => {
    const created = await postVehicle();

    const list = await request(createApp()).get('/api/vehicles').set('Authorization', authHeader());

    expect(list.body).toEqual([created.body]);
  });

  it('returns 403 for a logged-in user who is not an admin', async () => {
    const res = await postVehicle({}, 'user');

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 401 without a token', async () => {
    const res = await request(createApp()).post('/api/vehicles').send(validVehicle);

    expect(res.status).toBe(401);
  });

  it.each(['make', 'model', 'year', 'category', 'price'])(
    'returns 400 when %s is missing',
    async (field) => {
      const res = await postVehicle({ [field]: undefined });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([{ field, message: expect.any(String) }]);
    },
  );

  describe('make and model rule: trimmed, 1–50 characters', () => {
    it.each([
      ['make', 'whitespace-only', '   '],
      ['make', '51 characters', 'a'.repeat(51)],
      ['model', 'whitespace-only', '   '],
      ['model', '51 characters', 'a'.repeat(51)],
    ])('rejects a %s that is %s with 400', async (field, _case, value) => {
      const res = await postVehicle({ [field]: value });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([{ field, message: expect.any(String) }]);
    });

    it.each([
      ['make', '50 characters', 'a'.repeat(50), 'a'.repeat(50)],
      ['make', 'surrounding spaces', '  Toyota  ', 'Toyota'],
      ['model', '50 characters', 'a'.repeat(50), 'a'.repeat(50)],
      ['model', 'surrounding spaces', '  Corolla  ', 'Corolla'],
    ])('accepts a %s with %s and stores it trimmed', async (field, _case, value, stored) => {
      const res = await postVehicle({ [field]: value });

      expect(res.status).toBe(201);
      expect(res.body[field]).toBe(stored);
    });
  });

  describe('category rule: one of the list, case-insensitive', () => {
    it.each(['BOAT', ''])('rejects category %j with 400', async (category) => {
      const res = await postVehicle({ category });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([{ field: 'category', message: expect.any(String) }]);
    });

    it.each([
      ['suv', 'SUV'],
      [' Truck ', 'TRUCK'],
    ])('accepts %j and stores it as %j', async (category, stored) => {
      const res = await postVehicle({ category });

      expect(res.status).toBe(201);
      expect(res.body.category).toBe(stored);
    });
  });

  describe('year rule: integer from 1900 to next year', () => {
    // Computed, never hard-coded, so these tests don't break on 1 January.
    const nextYear = new Date().getFullYear() + 1;

    it.each([
      ['1899', 1899],
      ['the year after next', nextYear + 1],
      ['a non-integer', 2024.5],
    ])('rejects %s with 400', async (_case, year) => {
      const res = await postVehicle({ year });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([{ field: 'year', message: expect.any(String) }]);
    });

    it.each([
      ['1900', 1900],
      ['next year', nextYear],
    ])('accepts %s', async (_case, year) => {
      const res = await postVehicle({ year });

      expect(res.status).toBe(201);
      expect(res.body.year).toBe(year);
    });
  });

  describe('price rule: > 0, ≤ 100,000,000, at most 2 decimals', () => {
    it.each([
      ['zero', 0],
      ['negative', -1],
      ['a string', 'abc'],
      ['3 decimals', 1.234],
      ['over 100,000,000', 100_000_000.01],
    ])('rejects a price that is %s with 400', async (_case, price) => {
      const res = await postVehicle({ price });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([{ field: 'price', message: expect.any(String) }]);
    });

    // 19.99 * 100 is 1998.9999999999998 in JS, so a naive "× 100 is an integer" check rejects it.
    it.each([0.01, 19.99, 100_000_000])('accepts a price of %d', async (price) => {
      const res = await postVehicle({ price });

      expect(res.status).toBe(201);
      expect(res.body.price).toBe(price);
    });
  });

  describe('quantity rule: integer from 0 to 10,000', () => {
    it.each([
      ['negative', -1],
      ['a non-integer', 1.5],
      ['over 10,000', 10_001],
    ])('rejects a quantity that is %s with 400', async (_case, quantity) => {
      const res = await postVehicle({ quantity });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([{ field: 'quantity', message: expect.any(String) }]);
    });

    it.each([0, 10_000])('accepts a quantity of %d', async (quantity) => {
      const res = await postVehicle({ quantity });

      expect(res.status).toBe(201);
      expect(res.body.quantity).toBe(quantity);
    });
  });
});
