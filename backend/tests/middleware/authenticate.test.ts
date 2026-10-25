import request from 'supertest';
import { createApp } from '../../src/app';

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
});
