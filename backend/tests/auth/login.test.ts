import request from 'supertest';
import { createApp } from '../../src/app';
import { verifyToken } from '../../src/lib/jwt';

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

  it('returns a valid JWT whose sub is the user id, with role and exp', async () => {
    const { id } = await registerAnn();

    const res = await login();

    expect(verifyToken(res.body.token)).toMatchObject({
      sub: id,
      role: 'user',
      exp: expect.any(Number),
    });
  });

  it('never returns the password or its hash in user', async () => {
    await registerAnn();

    const res = await login();

    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user).not.toHaveProperty('password_hash');
    expect(JSON.stringify(res.body)).not.toMatch(/supersecret|\$2[aby]\$/);
  });

  it('returns 401 with a generic message for a wrong password', async () => {
    await registerAnn();

    const res = await login({ password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
  });

  it('returns the same 401 for an unknown email, so it does not reveal which emails exist', async () => {
    await registerAnn();
    const wrongPassword = await login({ password: 'wrong-password' });

    const unknownEmail = await login({ email: 'nobody@example.com' });

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it('treats the email case-insensitively', async () => {
    await registerAnn();

    const res = await login({ email: 'ANN@Example.COM' });

    expect(res.status).toBe(200);
  });
});
