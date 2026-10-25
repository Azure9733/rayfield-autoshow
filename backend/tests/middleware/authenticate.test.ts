import request from 'supertest';
import { createApp } from '../../src/app';
import { authHeader } from '../helpers/auth';

/** GET /api/vehicles with the given Authorization header (or none). */
function getProtected(authorization?: string) {
  const req = request(createApp()).get('/api/vehicles');
  return authorization === undefined ? req : req.set('Authorization', authorization);
}

describe('authenticate middleware (via GET /api/vehicles)', () => {
  it('returns 401 when there is no Authorization header', async () => {
    const res = await getProtected();

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it.each([
    ['a non-Bearer scheme', () => 'Basic abc123'],
    ['"Bearer" with no token', () => 'Bearer'],
    ['a bare token without "Bearer"', () => authHeader().replace('Bearer ', '')],
  ])('returns 401 for %s', async (_case, header) => {
    const res = await getProtected(header());

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});
