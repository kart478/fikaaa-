import { Prisma, type FikaStatus, type FikaType } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/api-error.js';
import { createNotification } from './notification.service.js';
import { publicUserSelect } from './user.service.js';
import { activeParticipantStatuses, canLeave, canTransitionStatus, isJoinable, nextAvailabilityStatus } from './fika.rules.js';

const fikaInclude = {
  host: { select: publicUserSelect },
  interests: { include: { interest: true } },
  participants: { where: { status: { in: activeParticipantStatuses } }, include: { user: { select: publicUserSelect } }, orderBy: { joinedAt: 'asc' } },
  _count: { select: { participants: { where: { status: { in: activeParticipantStatuses } } } } }
} satisfies Prisma.FikaInclude;

type FikaInput = {
  title: string; description: string; type: FikaType; date: Date; startTime: string; duration: number;
  locationName: string; latitude?: number | null; longitude?: number | null; maxParticipants: number; interestIds?: string[];
};

type FikaQuery = {
  type?: FikaType; date?: Date; location?: string; interest?: string; status?: FikaStatus;
  maxDistance?: number; limit: number; page: number; search?: string;
};

function toPrivateCoordinates(value: number | null | undefined) {
  return value === null || value === undefined ? null : new Prisma.Decimal(value);
}

function sanitizeFika<T extends { latitude?: unknown; longitude?: unknown }>(fika: T, includeCoordinates: boolean) {
  if (includeCoordinates) return fika;
  const { latitude: _latitude, longitude: _longitude, ...safeFika } = fika;
  return safeFika;
}

function calculateDistanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLat = radians(toLat - fromLat);
  const dLng = radians(toLng - fromLng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(fromLat)) * Math.cos(radians(toLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function assertInterestsExist(interestIds: string[] = []) {
  const uniqueIds = [...new Set(interestIds)];
  const count = await prisma.interest.count({ where: { id: { in: uniqueIds } } });
  if (count !== uniqueIds.length) throw new ApiError(404, 'One or more interests were not found', 'INTEREST_NOT_FOUND');
  return uniqueIds;
}

export async function createFika(hostId: string, input: FikaInput) {
  const interestIds = await assertInterestsExist(input.interestIds);
  const fika = await prisma.fika.create({
    data: {
      hostId, title: input.title, description: input.description, type: input.type, date: input.date,
      startTime: input.startTime, duration: input.duration, locationName: input.locationName,
      latitude: toPrivateCoordinates(input.latitude), longitude: toPrivateCoordinates(input.longitude),
      maxParticipants: input.maxParticipants,
      participants: { create: { userId: hostId, status: 'JOINED' } },
      interests: { create: interestIds.map((interestId) => ({ interestId })) }
    },
    include: fikaInclude
  });
  return sanitizeFika(fika, true);
}

export async function listFikas(query: FikaQuery, viewerId?: string) {
  const where: Prisma.FikaWhereInput = {
    ...(query.type ? { type: query.type } : {}),
    ...(query.status ? { status: query.status } : { status: { in: ['OPEN', 'FULL', 'STARTING', 'ACTIVE'] } }),
    ...(query.location ? { locationName: { contains: query.location, mode: 'insensitive' } } : {}),
    ...(query.interest ? { interests: { some: { interestId: query.interest } } } : {}),
    ...(query.search ? { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }, { locationName: { contains: query.search, mode: 'insensitive' } }] } : {})
  };
  if (query.date) {
    const nextDate = new Date(query.date);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    where.date = { gte: query.date, lt: nextDate };
  }

  let viewerCoordinates: { latitude: number; longitude: number } | undefined;
  if (viewerId) {
    const [blocks, viewer] = await Promise.all([
      prisma.block.findMany({ where: { OR: [{ blockerId: viewerId }, { blockedUserId: viewerId }] }, select: { blockerId: true, blockedUserId: true } }),
      prisma.user.findUnique({ where: { id: viewerId }, select: { latitude: true, longitude: true } })
    ]);
    const excludedUserIds = blocks.map((block) => block.blockerId === viewerId ? block.blockedUserId : block.blockerId);
    if (excludedUserIds.length) {
      where.hostId = { notIn: excludedUserIds };
      where.NOT = { participants: { some: { userId: { in: excludedUserIds } } } };
    }
    if (viewer?.latitude && viewer.longitude) viewerCoordinates = { latitude: Number(viewer.latitude), longitude: Number(viewer.longitude) };
  }
  if (query.maxDistance && !viewerCoordinates) throw new ApiError(422, 'Set your profile coordinates to filter by distance', 'LOCATION_REQUIRED');

  const requestedTake = query.maxDistance ? 200 : query.limit;
  const rows = await prisma.fika.findMany({ where, include: fikaInclude, orderBy: [{ date: 'asc' }, { startTime: 'asc' }], skip: query.maxDistance ? 0 : (query.page - 1) * query.limit, take: requestedTake });
  const nearby = query.maxDistance && viewerCoordinates
    ? rows.filter((fika) => fika.latitude && fika.longitude && calculateDistanceKm(viewerCoordinates.latitude, viewerCoordinates.longitude, Number(fika.latitude), Number(fika.longitude)) <= query.maxDistance!)
    : rows;
  const paged = query.maxDistance ? nearby.slice((query.page - 1) * query.limit, query.page * query.limit) : nearby;
  const total = query.maxDistance ? nearby.length : await prisma.fika.count({ where });
  return { items: paged.map((fika) => sanitizeFika(fika, false)), pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
}

export async function getFika(fikaId: string, viewerId?: string) {
  const fika = await prisma.fika.findUnique({ where: { id: fikaId }, include: fikaInclude });
  if (!fika) throw new ApiError(404, 'Fika not found', 'FIKA_NOT_FOUND');
  const isParticipant = viewerId ? fika.participants.some((participant) => participant.userId === viewerId) : false;
  return sanitizeFika(fika, isParticipant || fika.hostId === viewerId);
}

export async function updateFika(hostId: string, fikaId: string, input: Partial<FikaInput> & { status?: FikaStatus }) {
  const fika = await prisma.fika.findUnique({ where: { id: fikaId }, select: { hostId: true, status: true, maxParticipants: true } });
  if (!fika) throw new ApiError(404, 'Fika not found', 'FIKA_NOT_FOUND');
  if (fika.hostId !== hostId) throw new ApiError(403, 'Only the host can update this Fika', 'NOT_FIKA_HOST');
  if (['COMPLETED', 'CANCELLED'].includes(fika.status)) throw new ApiError(409, 'Closed Fikas cannot be changed', 'FIKA_CLOSED');
  if (input.status && !canTransitionStatus(fika.status, input.status)) throw new ApiError(409, 'Invalid Fika status transition', 'INVALID_FIKA_STATE');
  if (input.status === 'OPEN' || input.status === 'FULL') throw new ApiError(409, 'Fika capacity status is managed automatically', 'STATUS_MANAGED_BY_CAPACITY');
  let capacityStatus: FikaStatus | undefined;
  if (input.maxParticipants !== undefined) {
    const activeCount = await prisma.fikaParticipant.count({ where: { fikaId, status: { in: activeParticipantStatuses } } });
    if (input.maxParticipants < activeCount) throw new ApiError(409, 'Participant limit cannot be below the current number of participants', 'CAPACITY_TOO_LOW');
    capacityStatus = nextAvailabilityStatus(fika.status, activeCount, input.maxParticipants);
  }

  const interestIds = input.interestIds ? await assertInterestsExist(input.interestIds) : undefined;
  const { interestIds: _interestIds, latitude, longitude, status: requestedStatus, ...details } = input;
  const updated = await prisma.fika.update({
    where: { id: fikaId },
    data: {
      ...details,
      ...(requestedStatus ? { status: requestedStatus } : {}),
      ...(capacityStatus ? { status: capacityStatus } : {}),
      ...(latitude !== undefined ? { latitude: toPrivateCoordinates(latitude) } : {}),
      ...(longitude !== undefined ? { longitude: toPrivateCoordinates(longitude) } : {}),
      ...(interestIds ? { interests: { deleteMany: {}, create: interestIds.map((interestId) => ({ interestId })) } } : {})
    },
    include: fikaInclude
  });

  if (input.status === 'CANCELLED') {
    const recipients = updated.participants.map((participant) => participant.userId).filter((id) => id !== hostId);
    await Promise.all(recipients.map((userId) => createNotification({ userId, type: 'FIKA_CANCELLED', title: 'Fika cancelled', message: `${updated.title} has been cancelled by the host.` })));
  }
  return sanitizeFika(updated, true);
}

export async function cancelFika(hostId: string, fikaId: string) {
  return updateFika(hostId, fikaId, { status: 'CANCELLED' });
}

async function joinTransaction(fikaId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const fika = await tx.fika.findUnique({ where: { id: fikaId }, select: { id: true, title: true, hostId: true, maxParticipants: true, status: true } });
    if (!fika) throw new ApiError(404, 'Fika not found', 'FIKA_NOT_FOUND');
    if (!isJoinable(fika.status)) throw new ApiError(409, `This Fika cannot be joined because it is ${fika.status.toLowerCase()}`, 'FIKA_NOT_JOINABLE');

    const existing = await tx.fikaParticipant.findUnique({ where: { fikaId_userId: { fikaId, userId } } });
    if (existing?.status === 'JOINED' || existing?.status === 'ATTENDED') throw new ApiError(409, 'You are already participating in this Fika', 'ALREADY_JOINED');

    const activeCount = await tx.fikaParticipant.count({ where: { fikaId, status: { in: activeParticipantStatuses } } });
    if (activeCount >= fika.maxParticipants) throw new ApiError(409, 'Fika is already full', 'FIKA_FULL');

    const participant = existing
      ? await tx.fikaParticipant.update({ where: { fikaId_userId: { fikaId, userId } }, data: { status: 'JOINED', joinedAt: new Date() } })
      : await tx.fikaParticipant.create({ data: { fikaId, userId, status: 'JOINED' } });
    const finalCount = activeCount + 1;
    await tx.fika.update({ where: { id: fikaId }, data: { status: nextAvailabilityStatus(fika.status, finalCount, fika.maxParticipants) } });
    return { participant, fika };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function joinFika(fikaId: string, userId: string) {
  const fikaForBlockCheck = await prisma.fika.findUnique({ where: { id: fikaId }, select: { hostId: true } });
  if (!fikaForBlockCheck) throw new ApiError(404, 'Fika not found', 'FIKA_NOT_FOUND');
  const blockedRelationship = await prisma.block.findFirst({ where: { OR: [{ blockerId: userId, blockedUserId: fikaForBlockCheck.hostId }, { blockerId: fikaForBlockCheck.hostId, blockedUserId: userId }] }, select: { id: true } });
  if (blockedRelationship) throw new ApiError(403, 'You cannot join a Fika with a blocked user', 'BLOCKED_USER');
  let result: Awaited<ReturnType<typeof joinTransaction>> | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try { result = await joinTransaction(fikaId, userId); break; }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 2) continue;
      throw error;
    }
  }
  if (!result) throw new ApiError(409, 'Unable to join due to concurrent updates. Please try again.', 'JOIN_CONFLICT');
  if (result.fika.hostId !== userId) await createNotification({ userId: result.fika.hostId, type: 'FIKA_JOINED', title: 'Someone joined your Fika', message: 'A new participant joined ' + result.fika.title + '.' });
  return { participant: result.participant, fika: await getFika(fikaId, userId) };
}

export async function leaveFika(fikaId: string, userId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const fika = await tx.fika.findUnique({ where: { id: fikaId }, select: { id: true, title: true, hostId: true, maxParticipants: true, status: true } });
    if (!fika) throw new ApiError(404, 'Fika not found', 'FIKA_NOT_FOUND');
    if (!canLeave(fika.status)) throw new ApiError(409, 'You cannot leave after this Fika has started or ended', 'FIKA_ALREADY_STARTED');
    if (fika.hostId === userId) throw new ApiError(409, 'Hosts should cancel their Fika instead of leaving it', 'HOST_CANNOT_LEAVE');
    const participant = await tx.fikaParticipant.findUnique({ where: { fikaId_userId: { fikaId, userId } } });
    if (!participant || participant.status !== 'JOINED') throw new ApiError(409, 'You are not an active participant in this Fika', 'NOT_A_PARTICIPANT');
    await tx.fikaParticipant.update({ where: { id: participant.id }, data: { status: 'LEFT' } });
    const activeCount = await tx.fikaParticipant.count({ where: { fikaId, status: { in: activeParticipantStatuses } } });
    await tx.fika.update({ where: { id: fikaId }, data: { status: nextAvailabilityStatus(fika.status, activeCount, fika.maxParticipants) } });
    return fika;
  });
  await createNotification({ userId: result.hostId, type: 'FIKA_LEFT', title: 'A participant left your Fika', message: 'A participant left ' + result.title + '.' });
  return getFika(fikaId, userId);
}

export async function getParticipants(fikaId: string) {
  const exists = await prisma.fika.findUnique({ where: { id: fikaId }, select: { id: true } });
  if (!exists) throw new ApiError(404, 'Fika not found', 'FIKA_NOT_FOUND');
  return prisma.fikaParticipant.findMany({ where: { fikaId, status: { in: activeParticipantStatuses } }, include: { user: { select: publicUserSelect } }, orderBy: { joinedAt: 'asc' } });
}

export async function assertActiveParticipant(fikaId: string, userId: string) {
  const participant = await prisma.fikaParticipant.findFirst({ where: { fikaId, userId, status: { in: activeParticipantStatuses } }, select: { id: true } });
  if (!participant) throw new ApiError(403, 'Only Fika participants can access this room', 'NOT_FIKA_PARTICIPANT');
}
