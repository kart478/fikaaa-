import type { RequestHandler } from 'express';
import { COOKIE_NAME, verifyToken } from '../utils/auth.js';

export const optionalAuthenticate: RequestHandler = (request, _response, next) => {
  const token = request.cookies?.[COOKIE_NAME];
  if (token) {
    try { request.auth = verifyToken(token); } catch { /* Anonymous discovery remains available. */ }
  }
  next();
};
