import { Prisma, type FikaType } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/api-error.js';

export const publicUserSelect = {
  id: true,
  name: true,
  username: true,
  profileImage: true,
  bio: true,
  location: true,
  createdAt: true,
  interests: { include: { interest: true } },
  preferences: true
} satisfies Prisma.UserSelect;

export async function getPublicProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  return user;
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...publicUserSelect, email: true }
  });
  if (!user) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  return user;
}

type ProfileUpdate = {
  name?: string; username?: string; profileImage?: string | null; bio?: string | null;
  location?: string | null; latitude?: number | null; longitude?: number | null; preferences?: FikaType[];
};

export async function updateMyProfile(userId: string, input: ProfileUpdate) {
  const { preferences, latitude, longitude, ...profile } = input;
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        ...profile,
        ...(latitude !== undefined ? { latitude: latitude === null ? null : new Prisma.Decimal(latitude) } : {}),
        ...(longitude !== undefined ? { longitude: longitude === null ? null : new Prisma.Decimal(longitude) } : {})
      },
      select: { ...publicUserSelect, email: true }
    });

    if (preferences) {
      await tx.userActivityPreference.deleteMany({ where: { userId } });
      if (preferences.length) await tx.userActivityPreference.createMany({ data: preferences.map((type) => ({ userId, type })) });
    }

    return tx.user.findUniqueOrThrow({ where: { id: user.id }, select: { ...publicUserSelect, email: true } });
  });
}

export async function addMyInterests(userId: string, interestIds: string[]) {
  const existing = await prisma.interest.count({ where: { id: { in: interestIds } } });
  if (existing !== new Set(interestIds).size) throw new ApiError(404, 'One or more interests were not found', 'INTEREST_NOT_FOUND');
  await prisma.userInterest.createMany({ data: [...new Set(interestIds)].map((interestId) => ({ userId, interestId })), skipDuplicates: true });
  return getMyInterests(userId);
}

export async function getMyInterests(userId: string) {
  return prisma.userInterest.findMany({ where: { userId }, include: { interest: true }, orderBy: { interest: { name: 'asc' } } });
}

export async function removeMyInterest(userId: string, interestId: string) {
  const result = await prisma.userInterest.deleteMany({ where: { userId, interestId } });
  if (!result.count) throw new ApiError(404, 'Interest is not on your profile', 'USER_INTEREST_NOT_FOUND');
}

export async function getUserFikaHistory(userId: string, past: boolean) {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return prisma.fikaParticipant.findMany({
    where: {
      userId,
      fika: past ? { OR: [{ date: { lt: today } }, { status: { in: ['COMPLETED', 'CANCELLED'] } }] } : { date: { gte: today }, status: { in: ['OPEN', 'FULL', 'STARTING', 'ACTIVE'] } },
      status: { in: past ? ['JOINED', 'LEFT', 'CANCELLED', 'ATTENDED'] : ['JOINED'] }
    },
    include: { fika: { include: { host: { select: publicUserSelect }, _count: { select: { participants: { where: { status: { in: ['JOINED', 'ATTENDED'] } } } } } } } },
    orderBy: { fika: { date: past ? 'desc' : 'asc' } }
  });
}

export async function blockUser(blockerId: string, blockedUserId: string) {
  if (blockerId === blockedUserId) throw new ApiError(422, 'You cannot block yourself', 'INVALID_BLOCK');
  const target = await prisma.user.findUnique({ where: { id: blockedUserId }, select: { id: true } });
  if (!target) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  return prisma.block.upsert({ where: { blockerId_blockedUserId: { blockerId, blockedUserId } }, create: { blockerId, blockedUserId }, update: {} });
}

export async function unblockUser(blockerId: string, blockedUserId: string) {
  const result = await prisma.block.deleteMany({ where: { blockerId, blockedUserId } });
  if (!result.count) throw new ApiError(404, 'User is not blocked', 'BLOCK_NOT_FOUND');
}

export async function getBlockedUsers(userId: string) {
  return prisma.block.findMany({ where: { blockerId: userId }, include: { blocked: { select: publicUserSelect } }, orderBy: { createdAt: 'desc' } });
}
