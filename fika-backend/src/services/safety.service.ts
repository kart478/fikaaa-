import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/api-error.js';

export async function createReport(reporterId: string, input: { reportedUserId?: string; fikaId?: string; reason: string; description?: string }) {
  if (input.reportedUserId === reporterId) throw new ApiError(422, 'You cannot report yourself', 'INVALID_REPORT');
  if (input.reportedUserId) {
    const user = await prisma.user.findUnique({ where: { id: input.reportedUserId }, select: { id: true } });
    if (!user) throw new ApiError(404, 'Reported user not found', 'USER_NOT_FOUND');
  }
  if (input.fikaId) {
    const fika = await prisma.fika.findUnique({ where: { id: input.fikaId }, select: { id: true } });
    if (!fika) throw new ApiError(404, 'Reported Fika not found', 'FIKA_NOT_FOUND');
  }
  return prisma.report.create({ data: { reporterId, ...input } });
}
