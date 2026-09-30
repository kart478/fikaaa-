import type { RequestHandler } from 'express';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/api-error.js';
import { success } from '../utils/responses.js';

export const listInterestsController: RequestHandler = async (_request, response) => success(response, await prisma.interest.findMany({ orderBy: { name: 'asc' } }));
export const getInterestController: RequestHandler = async (request, response) => {
  const interest = await prisma.interest.findUnique({ where: { id: String(request.params.id) } });
  if (!interest) throw new ApiError(404, 'Interest not found', 'INTEREST_NOT_FOUND');
  success(response, interest);
};
