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

/** Registration and login rules; knows nothing about HTTP. */
export function createAuthService(users: UsersRepository): AuthService {
  return {
    async register({ name, email, password }) {
      return users.create({ name, email, passwordHash: await hashPassword(password) });
    },

    async login({ email, password }) {
      const found = await users.findByEmail(email);
      // Same error for both cases, so the response never reveals which emails are registered.
      if (!found || !(await comparePassword(password, found.passwordHash))) {
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
