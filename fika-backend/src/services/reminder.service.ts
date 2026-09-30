import { prisma } from '../config/prisma.js';
import { activeParticipantStatuses } from './fika.rules.js';
import { createNotification } from './notification.service.js';

function dateTimeForFika(date: Date, startTime: string) {
  const [hour, minute] = startTime.split(':').map(Number);
  const result = new Date(date);
  result.setUTCHours(hour, minute, 0, 0);
  return result;
}

export async function findFikasStartingWithin(minutes: number, from = new Date()) {
  const end = new Date(from.getTime() + minutes * 60_000);
  const candidates = await prisma.fika.findMany({ where: { status: { in: ['OPEN', 'FULL', 'STARTING'] }, date: { gte: new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())), lte: new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())) } }, include: { participants: { where: { status: { in: activeParticipantStatuses } }, select: { userId: true } } } });
  return candidates.filter((fika) => {
    const startsAt = dateTimeForFika(fika.date, fika.startTime);
    return startsAt >= from && startsAt <= end;
  });
}

export async function queueUpcomingFikaReminders(minutes = 60) {
  const fikas = await findFikasStartingWithin(minutes);
  await Promise.all(fikas.flatMap((fika) => fika.participants.map((participant) => createNotification({ userId: participant.userId, type: 'FIKA_REMINDER', title: 'Your Fika is coming up', message: `${fika.title} starts within ${minutes} minutes.` }))));
  return fikas.length;
}
