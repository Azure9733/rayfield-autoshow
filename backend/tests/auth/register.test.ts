import request from 'supertest';
import { createApp } from '../../src/app';
import { pool } from '../../src/db/client';
import { comparePassword } from '../../src/lib/password';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const validUser = { name: 'Ann Driver', email: 'ann@example.com', password: 'supersecret' };

/** Registers a user, overriding fields of a valid body (pass `undefined` to omit one). */
function register(overrides: Record<string, unknown> = {}) {
  return request(createApp())
    .post('/api/auth/register')
    .send({ ...validUser, ...overrides });
}

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

  it('stores the password as a bcrypt hash, not plain text', async () => {
    await request(createApp())
      .post('/api/auth/register')
      .send({ name: 'Ann Driver', email: 'ann@example.com', password: 'supersecret' });

    const { rows } = await pool.query<{ password_hash: string }>(
      'select password_hash from users where email = $1',
      ['ann@example.com'],
    );

    expect(rows[0].password_hash).not.toBe('supersecret');
    await expect(comparePassword('supersecret', rows[0].password_hash)).resolves.toBe(true);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(createApp())
      .post('/api/auth/register')
      .send({ email: 'ann@example.com', password: 'supersecret' });

    expect(res.status).toBe(400);
  });

  it('reports validation errors in the standard format', async () => {
    const res = await request(createApp())
      .post('/api/auth/register')
      .send({ email: 'ann@example.com', password: 'supersecret' });

    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: expect.any(String),
        details: [{ field: 'name', message: expect.any(String) }],
      },
    });
  });

  describe('name rule: trimmed, 1–60 characters', () => {
    it.each([
      ['whitespace-only', '   '],
      ['61 characters', 'a'.repeat(61)],
    ])('rejects a %s name with 400', async (_case, name) => {
      const res = await register({ name });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([{ field: 'name', message: expect.any(String) }]);
    });

    it.each([
      ['60 characters', 'a'.repeat(60), 'a'.repeat(60)],
      ['surrounding spaces', '  Ann  ', 'Ann'],
    ])('accepts a name with %s and stores it trimmed', async (_case, name, stored) => {
      const res = await register({ name });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(stored);
    });
  });

  describe('email rule: required, valid format', () => {
    it.each([
      ['missing', undefined],
      ['not an email address', 'not-an-email'],
    ])('rejects an email that is %s with 400', async (_case, email) => {
      const res = await register({ email });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([{ field: 'email', message: expect.any(String) }]);
    });
  });

  describe('password rule: at least 8 characters, at most 72 bytes', () => {
    it.each([
      ['missing', undefined],
      ['7 characters', 'a'.repeat(7)],
      ['73 ASCII characters', 'a'.repeat(73)],
      // Passes a 72-character check (19 emoji) but is 76 bytes; bcrypt would ignore the tail.
      ['19 emoji (76 bytes)', '😀'.repeat(19)],
    ])('rejects a password that is %s with 400', async (_case, password) => {
      const res = await register({ password });

      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([{ field: 'password', message: expect.any(String) }]);
    });

    it.each([
      ['exactly 8 characters', 'a'.repeat(8)],
      ['exactly 72 bytes', 'a'.repeat(72)],
    ])('accepts a password of %s', async (_case, password) => {
      const res = await register({ password });

      expect(res.status).toBe(201);
    });
  });
});
