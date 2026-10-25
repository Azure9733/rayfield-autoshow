import request from 'supertest';
import { createApp } from '../src/app';

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
});
