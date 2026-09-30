import { z } from 'zod';

export const ratingSchema = z.object({
  body: z.object({
    fikaId: z.string().cuid(),
    reviewedUserId: z.string().cuid(),
    rating: z.number().int().min(1).max(5),
    feedback: z.string().trim().max(800).optional()
  }),
  params: z.object({}),
  query: z.object({})
});

export const reportSchema = z.object({
  body: z.object({
    reportedUserId: z.string().cuid().optional(),
    fikaId: z.string().cuid().optional(),
    reason: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).optional()
  }).refine((value) => value.reportedUserId || value.fikaId, { message: 'Report a user or a Fika' }),
  params: z.object({}),
  query: z.object({})
});
