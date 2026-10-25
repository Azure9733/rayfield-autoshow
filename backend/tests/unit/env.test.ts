import { validateEnv } from '../../src/config/env';

// The minimum a valid environment needs; each test adds the variable it's about.
const base = {
  DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/rayfield_dev',
  JWT_SECRET: 'x'.repeat(32),
};

describe('env validation', () => {
  it.each([
    [undefined, false],
    ['false', false],
    ['true', true],
  ])('DATABASE_SSL=%s turns TLS %s', (value, expected) => {
    expect(validateEnv({ ...base, DATABASE_SSL: value }).DATABASE_SSL).toBe(expected);
  });

  // Only the two literal words: a typo like "ture" must fail at startup, not silently mean off.
  it.each(['yes', '1', 'TRUE', 'ture', ''])('rejects DATABASE_SSL=%j', (value) => {
    expect(() => validateEnv({ ...base, DATABASE_SSL: value })).toThrow();
  });

  it.each([
    [undefined, 10],
    ['5', 5],
    ['1', 1],
  ])('DATABASE_POOL_MAX=%s gives a pool of %i', (value, expected) => {
    expect(validateEnv({ ...base, DATABASE_POOL_MAX: value }).DATABASE_POOL_MAX).toBe(expected);
  });

  it.each(['0', '-1', '2.5', 'abc', ''])('rejects DATABASE_POOL_MAX=%j', (value) => {
    expect(() => validateEnv({ ...base, DATABASE_POOL_MAX: value })).toThrow();
  });
});
