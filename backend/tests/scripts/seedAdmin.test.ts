import request from 'supertest';
import { createApp } from '../../src/app';
import { seedAdmin } from '../../src/scripts/seedAdmin';

function login(email: string, password: string) {
  return request(createApp()).post('/api/auth/login').send({ email, password });
}

describe('seedAdmin', () => {
  it('creates an admin who can log in with the given email and password', async () => {
    await seedAdmin({ email: 'Admin@Example.com', password: 'admin-password-123' });

    const res = await login('admin@example.com', 'admin-password-123');

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: 'admin@example.com', role: 'admin' });
  });
});
