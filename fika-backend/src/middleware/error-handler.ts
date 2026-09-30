import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/api-error.js';

export const notFound: RequestHandler = (request, _response, next) =>
  next(new ApiError(404, `Route ${request.method} ${request.originalUrl} was not found`, 'NOT_FOUND'));

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({ success: false, message: error.message, errorCode: error.errorCode });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return response.status(409).json({ success: false, message: 'A record with that value already exists', errorCode: 'DUPLICATE_RECORD' });
  }

  console.error(error);
  return response.status(500).json({ success: false, message: 'An unexpected error occurred', errorCode: 'INTERNAL_ERROR' });
};
