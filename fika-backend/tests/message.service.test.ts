import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  fikaParticipant: { findFirst: vi.fn() },
  message: { create: vi.fn() }
}));

vi.mock('../src/config/prisma.js', () => ({ prisma: prismaMock }));

import { createMessage } from '../src/services/message.service.js';

describe('Fika chat access', () => {
  beforeEach(() => vi.resetAllMocks());

  it('does not allow a non-participant to send a room message', async () => {
    prismaMock.fikaParticipant.findFirst.mockResolvedValue(null);
    await expect(createMessage('clx12345678901234567890123', 'user-id', 'Hello')).rejects.toMatchObject({ errorCode: 'NOT_FIKA_PARTICIPANT' });
  });

  it('persists a non-empty message for an active participant', async () => {
    prismaMock.fikaParticipant.findFirst.mockResolvedValue({ id: 'participant' });
    prismaMock.message.create.mockResolvedValue({ id: 'message', content: 'Hello Fika!' });
    await expect(createMessage('clx12345678901234567890123', 'user-id', '  Hello Fika!  ')).resolves.toMatchObject({ content: 'Hello Fika!' });
    expect(prismaMock.message.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ content: 'Hello Fika!' }) }));
  });
});
