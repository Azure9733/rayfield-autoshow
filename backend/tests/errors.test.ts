import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/db/client';
import { createUsersRepository } from '../src/modules/auth/users.repository';
import type { VehiclesRepository } from '../src/modules/vehicles/vehicles.repository';
import { authHeader } from './helpers/auth';

afterEach(() => jest.restoreAllMocks());

describe('error responses', () => {
  it('answers an unknown route with 404 JSON, not an HTML page', async () => {
    const res = await request(createApp()).get('/api/no-such-route');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  it('answers a malformed JSON body with 400 JSON', async () => {
    const res = await request(createApp())
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "ann@example.com",');

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({
      error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' },
    });
  });

  it('answers an unexpected error with 500 JSON, a generic message and no stack trace', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {}); // keep the expected log quiet
    const failingVehicles = {
      search: () => Promise.reject(new Error('connection to the database lost')),
    } as unknown as VehiclesRepository;
    const app = createApp({
      repos: { users: createUsersRepository(db), vehicles: failingVehicles },
    });

    const res = await request(app).get('/api/vehicles').set('Authorization', authHeader());

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
    expect(res.text).not.toMatch(/connection to the database lost|\.ts:\d+/);
  });
});
