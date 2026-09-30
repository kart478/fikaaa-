import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/api-error.js';
import { assertActiveParticipant } from './fika.service.js';
import { publicUserSelect } from './user.service.js';

export async function listMessages(fikaId: string, userId: string, page: number, limit: number) {
  await assertActiveParticipant(fikaId, userId);
  const [items, total] = await Promise.all([
    prisma.message.findMany({ where: { fikaId }, include: { sender: { select: publicUserSelect } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.message.count({ where: { fikaId } })
  ]);
  return { items: items.reverse(), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

export async function createMessage(fikaId: string, senderId: string, content: string) {
  await assertActiveParticipant(fikaId, senderId);
  const cleanContent = content.trim();
  if (!cleanContent) throw new ApiError(422, 'Messages cannot be empty', 'EMPTY_MESSAGE');
  if (cleanContent.length > 1000) throw new ApiError(422, 'Messages cannot exceed 1000 characters', 'MESSAGE_TOO_LONG');
  return prisma.message.create({ data: { fikaId, senderId, content: cleanContent }, include: { sender: { select: publicUserSelect } } });
}
