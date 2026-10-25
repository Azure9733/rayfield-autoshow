import type { Request, Response } from 'express';
import type { AuthService, LoginInput, RegisterInput } from './auth.service';

/** Translates HTTP requests into auth service calls and back; no business rules here. */
export function createAuthController(service: AuthService) {
  return {
    async register(_req: Request, res: Response) {
      const user = await service.register(res.locals.body as RegisterInput);
      res.status(201).json(user);
    },

    async login(_req: Request, res: Response) {
      res.json(await service.login(res.locals.body as LoginInput));
    },
  };
}
