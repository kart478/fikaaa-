import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  fika: { findUnique: vi.fn() },
  fikaParticipant: { findMany: vi.fn() },
  rating: { findUnique: vi.fn(), create: vi.fn() }
}));

vi.mock('../src/config/prisma.js', () => ({ prisma: prismaMock }));

import { createRating } from '../src/services/rating.service.js';

describe('ratings service', () => {
  beforeEach(() => vi.resetAllMocks());

  it('does not permit self-ratings', async () => {
    await expect(createRating({ fikaId: 'clx12345678901234567890123', reviewerId: 'user-id', reviewedUserId: 'user-id', rating: 5 }))
      .rejects.toMatchObject({ errorCode: 'SELF_RATING' });
  });

  it('only opens ratings once a Fika is completed', async () => {
    prismaMock.fika.findUnique.mockResolvedValue({ status: 'ACTIVE' });
    await expect(createRating({ fikaId: 'clx12345678901234567890123', reviewerId: 'reviewer', reviewedUserId: 'reviewed', rating: 5 }))
      .rejects.toMatchObject({ errorCode: 'FIKA_NOT_COMPLETED' });
  });

  it('prevents duplicate ratings for the same Fika and participant', async () => {
    prismaMock.fika.findUnique.mockResolvedValue({ status: 'COMPLETED' });
    prismaMock.fikaParticipant.findMany.mockResolvedValue([{ userId: 'reviewer' }, { userId: 'reviewed' }]);
    prismaMock.rating.findUnique.mockResolvedValue({ id: 'existing-rating' });
    await expect(createRating({ fikaId: 'clx12345678901234567890123', reviewerId: 'reviewer', reviewedUserId: 'reviewed', rating: 4 }))
      .rejects.toMatchObject({ errorCode: 'DUPLICATE_RATING' });
  });
});
