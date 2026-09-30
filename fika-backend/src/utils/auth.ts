import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from '../config/env.js';

const COOKIE_NAME = 'fika_session';
const MAX_AGE = 1000 * 60 * 60 * 24 * 7;

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, env.SESSION_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  const payload = jwt.verify(token, env.SESSION_SECRET);
  if (typeof payload === 'string' || !payload.sub) throw new Error('Invalid session token');
  return { userId: payload.sub };
}

export function setSessionCookie(response: Response, userId: string) {
  response.cookie(COOKIE_NAME, signToken(userId), {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: MAX_AGE,
    path: '/'
  });
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
  });
}

export { COOKIE_NAME };
