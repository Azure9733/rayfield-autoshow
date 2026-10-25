import request from 'supertest';
import { createApp } from '../../src/app';

const ann = { name: 'Ann Driver', email: 'ann@example.com', password: 'supersecret' };

/** Creates Ann through the real register endpoint, so login tests see a genuine stored hash. */
async function registerAnn() {
  const res = await request(createApp()).post('/api/auth/register').send(ann);
  return res.body as { id: string };
}

/** Logs in, overriding fields of Ann's valid credentials (pass `undefined` to omit one). */
function login(overrides: Record<string, unknown> = {}) {
  return request(createApp())
    .post('/api/auth/login')
    .send({ email: ann.email, password: ann.password, ...overrides });
}

describe('POST /api/auth/login', () => {
  it('returns 200 with { token, user } for correct credentials', async () => {
    const { id } = await registerAnn();

    const res = await login();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      token: expect.any(String),
      user: { id, name: ann.name, email: ann.email, role: 'user' },
    });
  });
});
