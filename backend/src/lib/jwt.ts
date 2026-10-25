import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

/** Claims we put in every access token. */
export interface TokenClaims {
  sub: string;
  role: 'user' | 'admin';
}

export interface TokenPayload extends TokenClaims {
  iat: number;
  exp: number;
}

// Pin the algorithm on both sides so a token can't pick its own (e.g. "none").
const ALGORITHM = 'HS256';

/** Signs an access token that expires after JWT_EXPIRES_IN. */
export function signToken(claims: TokenClaims): string {
  return jwt.sign(claims, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

/** Verifies signature and expiry; throws if either is invalid. */
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] }) as TokenPayload;
}
