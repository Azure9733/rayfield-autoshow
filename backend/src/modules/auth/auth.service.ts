import type { NewUser, PublicUser, UsersRepository } from './users.repository';

export interface AuthService {
  register(input: NewUser): Promise<PublicUser>;
}

/** Registration and login rules; knows nothing about HTTP. */
export function createAuthService(users: UsersRepository): AuthService {
  return {
    register(input) {
      return users.create(input);
    },
  };
}
