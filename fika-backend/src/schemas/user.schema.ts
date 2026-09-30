import { z } from 'zod';

const optionalCoordinate = z.number().min(-180).max(180).nullable().optional();

export const userIdParams = z.object({
  body: z.object({}),
  params: z.object({ id: z.string().cuid() }),
  query: z.object({})
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80).optional(),
    username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/).optional(),
    profileImage: z.string().url().max(2048).nullable().optional(),
    bio: z.string().trim().max(500).nullable().optional(),
    location: z.string().trim().max(120).nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: optionalCoordinate,
    preferences: z.array(z.enum(['COFFEE', 'FOOD', 'WALK', 'CONVERSATION', 'GAMING', 'STUDY', 'NETWORKING', 'CREATIVE', 'SPORTS', 'MUSIC'])).max(10).optional()
  }).refine((data) => !(data.latitude !== undefined && data.longitude === undefined) && !(data.longitude !== undefined && data.latitude === undefined), { message: 'Latitude and longitude must be supplied together' }),
  params: z.object({}),
  query: z.object({})
});

export const interestMutationSchema = z.object({
  body: z.object({ interestIds: z.array(z.string().cuid()).min(1).max(25) }),
  params: z.object({}),
  query: z.object({})
});

export const interestIdParams = z.object({
  body: z.object({}),
  params: z.object({ interestId: z.string().cuid() }),
  query: z.object({})
});
