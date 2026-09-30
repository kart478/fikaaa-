import { z } from 'zod';

export const fikaTypes = ['COFFEE', 'FOOD', 'WALK', 'CONVERSATION', 'GAMING', 'STUDY', 'NETWORKING', 'CREATIVE', 'SPORTS', 'MUSIC'] as const;
export const fikaStatuses = ['OPEN', 'FULL', 'STARTING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm time format');

const fikaFields = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(10).max(1200),
  type: z.enum(fikaTypes),
  date: z.coerce.date(),
  startTime: time,
  duration: z.number().int().min(30).max(480),
  locationName: z.string().trim().min(2).max(180),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  maxParticipants: z.number().int().min(2).max(10),
  interestIds: z.array(z.string().cuid()).max(10).default([])
});

const coordinatePair = (data: { latitude?: number | null; longitude?: number | null }) =>
  !(data.latitude !== undefined && data.longitude === undefined) && !(data.longitude !== undefined && data.latitude === undefined);

export const createFikaSchema = z.object({ body: fikaFields.refine(coordinatePair, { message: 'Latitude and longitude must be supplied together' }), params: z.object({}), query: z.object({}) });

export const updateFikaSchema = z.object({
  body: fikaFields.partial().extend({ status: z.enum(fikaStatuses).optional() }).refine(coordinatePair, { message: 'Latitude and longitude must be supplied together' }),
  params: z.object({ id: z.string().cuid() }),
  query: z.object({})
});

export const fikaIdParams = z.object({ body: z.object({}), params: z.object({ id: z.string().cuid() }), query: z.object({}) });

export const discoverFikasSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    type: z.enum(fikaTypes).optional(),
    date: z.coerce.date().optional(),
    location: z.string().trim().max(120).optional(),
    interest: z.string().cuid().optional(),
    status: z.enum(fikaStatuses).optional(),
    maxDistance: z.coerce.number().positive().max(100).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    page: z.coerce.number().int().min(1).default(1),
    search: z.string().trim().max(100).optional()
  })
});

export const messagesSchema = z.object({
  body: z.object({}),
  params: z.object({ fikaId: z.string().cuid() }),
  query: z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(30) })
});
