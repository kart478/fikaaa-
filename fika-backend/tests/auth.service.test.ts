import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() }
}));

vi.mock('../src/config/prisma.js', () => ({ prisma: prismaMock }));

import { login, register } from '../src/services/auth.service.js';

describe('authentication service', () => {
  beforeEach(() => vi.resetAllMocks());

  it('prevents duplicate email registration', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ email: 'amara@example.com', username: 'amara' });
    await expect(register({ name: 'Amara', username: 'another_amara', email: 'amara@example.com', password: 'strong-password' }))
      .rejects.toMatchObject({ errorCode: 'EMAIL_TAKEN' });
  });

  it('rejects invalid credentials without revealing which field was wrong', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(login('missing@example.com', 'wrong-password')).rejects.toMatchObject({ errorCode: 'INVALID_CREDENTIALS' });
  });

  it('hashes a new password and returns a sanitized current user', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockImplementation(async ({ data }: { data: { passwordHash: string } }) => {
      expect(data.passwordHash).not.toBe('strong-password');
      return { id: 'clx12345678901234567890123' };
    });
    prismaMock.user.findUnique.mockResolvedValue({ id: 'clx12345678901234567890123', name: 'Amara', email: 'amara@example.com', interests: [], preferences: [] });
    await expect(register({ name: 'Amara', username: 'amara', email: 'amara@example.com', password: 'strong-password' }))
      .resolves.not.toHaveProperty('passwordHash');
  });
});
