import { signToken, verifyToken } from '../../src/lib/jwt';

describe('JWT helpers', () => {
  it('round-trips sub and role, and sets an expiry', () => {
    const token = signToken({ sub: 'user-1', role: 'admin' });

    const payload = verifyToken(token);

    expect(payload).toMatchObject({ sub: 'user-1', role: 'admin' });
    expect(payload.exp).toEqual(expect.any(Number));
  });
});
