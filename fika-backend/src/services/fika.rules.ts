import type { FikaStatus, ParticipantStatus } from '@prisma/client';

export const activeParticipantStatuses: ParticipantStatus[] = ['JOINED', 'ATTENDED'];

export function isJoinable(status: FikaStatus) {
  return status === 'OPEN' || status === 'FULL';
}

export function canLeave(status: FikaStatus) {
  return status === 'OPEN' || status === 'FULL' || status === 'STARTING';
}

export function nextAvailabilityStatus(current: FikaStatus, activeCount: number, maximum: number): FikaStatus {
  if (!['OPEN', 'FULL'].includes(current)) return current;
  return activeCount >= maximum ? 'FULL' : 'OPEN';
}

export function canTransitionStatus(from: FikaStatus, to: FikaStatus) {
  if (from === to) return true;
  const transitions: Record<FikaStatus, FikaStatus[]> = {
    OPEN: ['FULL', 'STARTING', 'ACTIVE', 'CANCELLED'],
    FULL: ['OPEN', 'STARTING', 'ACTIVE', 'CANCELLED'],
    STARTING: ['ACTIVE', 'CANCELLED'],
    ACTIVE: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: []
  };
  return transitions[from].includes(to);
}
