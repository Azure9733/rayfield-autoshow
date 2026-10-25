import request from 'supertest';
import { createApp } from '../../src/app';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201 with exactly { id, name, email, role: "user" }', async () => {
    const res = await request(createApp())
      .post('/api/auth/register')
      .send({ name: 'Ann Driver', email: 'ann@example.com', password: 'supersecret' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.stringMatching(UUID),
      name: 'Ann Driver',
      email: 'ann@example.com',
      role: 'user',
    });
  });

  it('never returns the password or its hash', async () => {
    const res = await request(createApp())
      .post('/api/auth/register')
      .send({ name: 'Ann Driver', email: 'ann@example.com', password: 'supersecret' });

    expect(res.body).not.toHaveProperty('password');
    expect(res.body).not.toHaveProperty('passwordHash');
    expect(res.body).not.toHaveProperty('password_hash');
    expect(JSON.stringify(res.body)).not.toContain('supersecret');
  });
});
