import { z } from 'zod';

const email = z.string().trim().email().max(254).toLowerCase();
const username = z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/, 'Use 3–30 lowercase letters, numbers, or underscores');

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    username,
    email,
    password: z.string().min(8).max(72)
  }),
  params: z.object({}),
  query: z.object({})
});

export const loginSchema = z.object({
  body: z.object({ email, password: z.string().min(1).max(72) }),
  params: z.object({}),
  query: z.object({})
});
