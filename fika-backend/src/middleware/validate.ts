import type { RequestHandler } from 'express';
import { ZodError, type ZodType } from 'zod';
import { ApiError } from '../utils/api-error.js';

export const validate = (schema: ZodType): RequestHandler => (request, _response, next) => {
  try {
    const parsed = schema.parse({ body: request.body ?? {}, params: request.params, query: request.query });
    request.body = parsed.body;
    request.params = parsed.params;
    Object.defineProperty(request, 'query', { configurable: true, enumerable: true, writable: true, value: parsed.query });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return next(new ApiError(422, 'Request validation failed', 'VALIDATION_ERROR'));
    }
    next(error);
  }
};
