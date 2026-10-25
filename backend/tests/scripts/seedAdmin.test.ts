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

  describe('re-running', () => {
    it('resets the admin password from the new value', async () => {
      await seedAdmin({ email: 'admin@example.com', password: 'first-password-1' });

      await seedAdmin({ email: 'admin@example.com', password: 'second-password-2' });

      expect((await login('admin@example.com', 'second-password-2')).status).toBe(200);
      expect((await login('admin@example.com', 'first-password-1')).status).toBe(401);
    });

    it('takes over an email first registered by a normal user: role and password both reset', async () => {
      await request(createApp())
        .post('/api/auth/register')
        .send({ name: 'Squatter', email: 'admin@example.com', password: 'squatter-password' });

      await seedAdmin({ email: 'admin@example.com', password: 'admin-password-123' });

      const asAdmin = await login('admin@example.com', 'admin-password-123');
      expect(asAdmin.status).toBe(200);
      expect(asAdmin.body.user.role).toBe('admin');
      // Whoever registered the email first must not keep access to the admin account.
      expect((await login('admin@example.com', 'squatter-password')).status).toBe(401);
    });
  });
});
