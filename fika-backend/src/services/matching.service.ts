import type { FikaType } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { publicUserSelect } from './user.service.js';

type CompatibilityInput = { sharedInterests: number; sharedPreferences: number; sameArea: boolean; compatibleActivity: boolean };

export function compatibilityScore(input: CompatibilityInput) {
  const raw = input.sharedInterests * 5 + input.sharedPreferences * 3 + (input.sameArea ? 3 : 0) + (input.compatibleActivity ? 5 : 0);
  return Math.min(100, raw * 2);
}

export async function matchingSuggestions(userId: string, fikaType?: FikaType) {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { interests: { include: { interest: true } }, preferences: true, blocksCreated: { select: { blockedUserId: true } }, blocksReceived: { select: { blockerId: true } } }
  });
  if (!currentUser) return [];

  const excludedIds = [userId, ...currentUser.blocksCreated.map((block) => block.blockedUserId), ...currentUser.blocksReceived.map((block) => block.blockerId)];
  const candidates = await prisma.user.findMany({
    where: { id: { notIn: excludedIds } },
    select: publicUserSelect,
    take: 50
  });
  const ownInterests = new Set(currentUser.interests.map((item) => item.interest.name));
  const ownPreferences = new Set(currentUser.preferences.map((item) => item.type));

  return candidates.map((candidate) => {
    const sharedInterests = candidate.interests.map((item) => item.interest.name).filter((name) => ownInterests.has(name));
    const sharedPreferences = candidate.preferences.map((item) => item.type).filter((type) => ownPreferences.has(type));
    const compatibleActivity = Boolean(fikaType && ownPreferences.has(fikaType) && candidate.preferences.some((preference) => preference.type === fikaType));
    return {
      user: candidate,
      compatibility: compatibilityScore({ sharedInterests: sharedInterests.length, sharedPreferences: sharedPreferences.length, sameArea: Boolean(currentUser.location && currentUser.location === candidate.location), compatibleActivity }),
      sharedInterests,
      sharedPreferences
    };
  }).filter((item) => item.compatibility > 0).sort((a, b) => b.compatibility - a.compatibility).slice(0, 20);
}
