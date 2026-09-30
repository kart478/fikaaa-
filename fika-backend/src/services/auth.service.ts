import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/api-error.js';
import { getMe } from './user.service.js';

type Registration = { name: string; username: string; email: string; password: string };

export async function register(input: Registration) {
  const existing = await prisma.user.findFirst({ where: { OR: [{ email: input.email }, { username: input.username }] }, select: { email: true, username: true } });
  if (existing?.email === input.email) throw new ApiError(409, 'An account already uses this email', 'EMAIL_TAKEN');
  if (existing?.username === input.username) throw new ApiError(409, 'That username is already taken', 'USERNAME_TAKEN');

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({ data: { name: input.name, username: input.username, email: input.email, passwordHash }, select: { id: true } });
  return getMe(user.id);
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, 'Email or password is incorrect', 'INVALID_CREDENTIALS');
  }
  return getMe(user.id);
}
