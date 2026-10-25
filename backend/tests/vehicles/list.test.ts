import request from 'supertest';
import { createApp } from '../../src/app';
import { authHeader } from '../helpers/auth';

function listVehicles() {
  return request(createApp()).get('/api/vehicles').set('Authorization', authHeader());
}

describe('GET /api/vehicles', () => {
  it('returns 200 with [] when there are no vehicles', async () => {
    const res = await listVehicles();

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
