import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/api-error.js';
import { activeParticipantStatuses } from './fika.rules.js';

export async function createRating(input: { fikaId: string; reviewerId: string; reviewedUserId: string; rating: number; feedback?: string }) {
  if (input.reviewerId === input.reviewedUserId) throw new ApiError(422, 'You cannot rate yourself', 'SELF_RATING');
  const fika = await prisma.fika.findUnique({ where: { id: input.fikaId }, select: { status: true } });
  if (!fika) throw new ApiError(404, 'Fika not found', 'FIKA_NOT_FOUND');
  if (fika.status !== 'COMPLETED') throw new ApiError(409, 'Ratings are available once a Fika is completed', 'FIKA_NOT_COMPLETED');
  const participants = await prisma.fikaParticipant.findMany({ where: { fikaId: input.fikaId, userId: { in: [input.reviewerId, input.reviewedUserId] }, status: { in: activeParticipantStatuses } }, select: { userId: true } });
  if (participants.length !== 2) throw new ApiError(403, 'Both people must have participated in this Fika', 'NOT_ELIGIBLE_TO_RATE');
  const existing = await prisma.rating.findUnique({ where: { fikaId_reviewerId_reviewedUserId: { fikaId: input.fikaId, reviewerId: input.reviewerId, reviewedUserId: input.reviewedUserId } } });
  if (existing) throw new ApiError(409, 'You have already rated this participant for this Fika', 'DUPLICATE_RATING');
  return prisma.rating.create({ data: input });
}
