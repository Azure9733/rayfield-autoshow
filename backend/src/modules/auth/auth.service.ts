import { hashPassword } from '../../lib/password';
import type { PublicUser, UsersRepository } from './users.repository';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface AuthService {
  register(input: RegisterInput): Promise<PublicUser>;
}

/** Registration and login rules; knows nothing about HTTP. */
export function createAuthService(users: UsersRepository): AuthService {
  return {
    async register({ name, email, password }) {
      return users.create({ name, email, passwordHash: await hashPassword(password) });
    },
  };
}
