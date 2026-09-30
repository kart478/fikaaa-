import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  interest: { count: vi.fn() },
  block: { findMany: vi.fn(), findFirst: vi.fn() },
  user: { findUnique: vi.fn() },
  fika: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
  fikaParticipant: { findUnique: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
  $transaction: vi.fn()
}));

vi.mock('../src/config/prisma.js', () => ({ prisma: prismaMock }));
vi.mock('../src/services/notification.service.js', () => ({ createNotification: vi.fn() }));

import { joinFika, updateFika } from '../src/services/fika.service.js';

describe('Fika service protection', () => {
  beforeEach(() => vi.resetAllMocks());

  it('prevents a non-host from editing a Fika', async () => {
    prismaMock.fika.findUnique.mockResolvedValue({ hostId: 'host-id', status: 'OPEN', maxParticipants: 4 });
    await expect(updateFika('another-user', 'clx12345678901234567890123', { title: 'Changed title' }))
      .rejects.toMatchObject({ errorCode: 'NOT_FIKA_HOST' });
  });

  it('prevents duplicate participation', async () => {
    prismaMock.fika.findUnique.mockResolvedValue({ hostId: 'host-id' });
    prismaMock.block.findFirst.mockResolvedValue(null);
    const tx = {
      fika: { findUnique: vi.fn().mockResolvedValue({ id: 'fika-id', title: 'Coffee', hostId: 'host-id', maxParticipants: 4, status: 'OPEN' }), update: vi.fn() },
      fikaParticipant: { findUnique: vi.fn().mockResolvedValue({ status: 'JOINED' }), count: vi.fn() }
    };
    prismaMock.$transaction.mockImplementation((work: (database: typeof tx) => unknown) => work(tx));
    await expect(joinFika('clx12345678901234567890123', 'user-id')).rejects.toMatchObject({ errorCode: 'ALREADY_JOINED' });
  });

  it('prevents joining a Fika hosted by a blocked user', async () => {
    prismaMock.fika.findUnique.mockResolvedValue({ hostId: 'host-id' });
    prismaMock.block.findFirst.mockResolvedValue({ id: 'block-id' });
    await expect(joinFika('clx12345678901234567890123', 'user-id')).rejects.toMatchObject({ errorCode: 'BLOCKED_USER' });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('prevents joining a Fika at capacity', async () => {
    prismaMock.fika.findUnique.mockResolvedValue({ hostId: 'host-id' });
    prismaMock.block.findFirst.mockResolvedValue(null);
    const tx = {
      fika: { findUnique: vi.fn().mockResolvedValue({ id: 'fika-id', title: 'Coffee', hostId: 'host-id', maxParticipants: 2, status: 'FULL' }), update: vi.fn() },
      fikaParticipant: { findUnique: vi.fn().mockResolvedValue(null), count: vi.fn().mockResolvedValue(2) }
    };
    prismaMock.$transaction.mockImplementation((work: (database: typeof tx) => unknown) => work(tx));
    await expect(joinFika('clx12345678901234567890123', 'user-id')).rejects.toMatchObject({ errorCode: 'FIKA_FULL' });
  });
});
