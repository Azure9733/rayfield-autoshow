import * as password from '../../src/lib/password';
import { createAuthService } from '../../src/modules/auth/auth.service';
import type { UsersRepository } from '../../src/modules/auth/users.repository';

/** A users repository that knows no users; enough to exercise the unknown-email path. */
function emptyUsersRepository(): UsersRepository {
  return {
    create: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(undefined),
  };
}

afterEach(() => jest.restoreAllMocks());

describe('auth service login', () => {
  it('still runs a bcrypt comparison for an unknown email, so timing does not reveal it', async () => {
    const compare = jest.spyOn(password, 'comparePassword');
    const service = createAuthService(emptyUsersRepository());

    await expect(
      service.login({ email: 'nobody@example.com', password: 'whatever-password' }),
    ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    expect(compare).toHaveBeenCalledTimes(1);
  });
});
