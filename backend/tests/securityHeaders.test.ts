import request from 'supertest';
import { createApp } from '../src/app';

describe('security headers (helmet)', () => {
  it('sets standard security headers and hides the framework', async () => {
    const res = await request(createApp()).get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['strict-transport-security']).toMatch(/max-age=\d+/);
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
