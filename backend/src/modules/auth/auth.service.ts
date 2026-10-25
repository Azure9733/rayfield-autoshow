import { randomUUID } from 'node:crypto';
import { UnauthorizedError } from '../../lib/errors';
import { signToken } from '../../lib/jwt';
import { comparePassword, hashPassword } from '../../lib/password';
import type { PublicUser, UsersRepository } from './users.repository';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: PublicUser;
}

export interface AuthService {
  register(input: RegisterInput): Promise<PublicUser>;
  login(input: LoginInput): Promise<LoginResult>;
}

let dummyHash: Promise<string> | undefined;

/**
 * A bcrypt hash of a random value, made once with the same cost as real hashes. Unknown
 * emails are compared against it so they take as long as a wrong password.
 */
function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomUUID());
  return dummyHash;
}

/** Registration and login rules; knows nothing about HTTP. */
export function createAuthService(users: UsersRepository): AuthService {
  return {
    async register({ name, email, password }) {
      return users.create({ name, email, passwordHash: await hashPassword(password) });
    },

    async login({ email, password }) {
      const found = await users.findByEmail(email);
      // Always run one bcrypt comparison and throw the same error, so neither the response
      // nor its timing reveals which emails are registered.
      const matches = await comparePassword(
        password,
        found?.passwordHash ?? (await getDummyHash()),
      );
      if (!found || !matches) {
        throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid email or password');
      }
      const user: PublicUser = {
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
      };
      return { token: signToken({ sub: user.id, role: user.role }), user };
    },
  };
}
