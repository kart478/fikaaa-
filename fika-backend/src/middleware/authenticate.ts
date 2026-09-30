import type { RequestHandler } from 'express';
import { ApiError } from '../utils/api-error.js';
import { COOKIE_NAME, verifyToken } from '../utils/auth.js';

export const authenticate: RequestHandler = (request, _response, next) => {
  const token = request.cookies?.[COOKIE_NAME];
  if (!token) return next(new ApiError(401, 'Authentication is required', 'UNAUTHENTICATED'));

  try {
    request.auth = verifyToken(token);
    next();
  } catch {
    next(new ApiError(401, 'Your session is invalid or has expired', 'UNAUTHENTICATED'));
  }
};
