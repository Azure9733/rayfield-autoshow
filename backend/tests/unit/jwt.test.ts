import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';
import { signToken, verifyToken } from '../../src/lib/jwt';

/** Re-encodes the payload with role "admin" but keeps the original signature. */
function withEditedRole(token: string): string {
  const [header, payload, signature] = token.split('.');
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
  const edited = Buffer.from(JSON.stringify({ ...claims, role: 'admin' })).toString('base64url');
  return [header, edited, signature].join('.');
}

describe('JWT helpers', () => {
  it('round-trips sub and role, and sets an expiry', () => {
    const token = signToken({ sub: 'user-1', role: 'admin' });

    const payload = verifyToken(token);

    expect(payload).toMatchObject({ sub: 'user-1', role: 'admin' });
    expect(payload.exp).toEqual(expect.any(Number));
  });

  it.each([
    ['a payload edited after signing', () => withEditedRole(signToken({ sub: 'u', role: 'user' }))],
    [
      'a signature from another secret',
      () => jwt.sign({ sub: 'u', role: 'user' }, 'some-other-secret-that-is-long-enough'),
    ],
    [
      'an expired token',
      () => jwt.sign({ sub: 'u', role: 'user' }, env.JWT_SECRET, { expiresIn: -10 }),
    ],
  ])('verifyToken rejects %s', (_case, makeToken) => {
    expect(() => verifyToken(makeToken())).toThrow();
  });
});
