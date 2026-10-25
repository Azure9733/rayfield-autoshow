import request from 'supertest';
import { createApp } from '../src/app';

describe('error responses', () => {
  it('answers an unknown route with 404 JSON, not an HTML page', async () => {
    const res = await request(createApp()).get('/api/no-such-route');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });
});
