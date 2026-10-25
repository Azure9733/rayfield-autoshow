import { comparePassword, hashPassword } from '../../src/lib/password';

describe('password hashing', () => {
  it('compares true for the right password and false for a wrong one', async () => {
    const hash = await hashPassword('supersecret');

    await expect(comparePassword('supersecret', hash)).resolves.toBe(true);
    await expect(comparePassword('wrong-password', hash)).resolves.toBe(false);
  });
});
