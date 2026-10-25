import type { Request, Response } from 'express';
import type { AuthService } from './auth.service';

/** Translates HTTP requests into auth service calls and back; no business rules here. */
export function createAuthController(service: AuthService) {
  return {
    async register(req: Request, res: Response) {
      const { name, email, password } = req.body;
      const user = await service.register({ name, email, password });
      res.status(201).json(user);
    },
  };
}
