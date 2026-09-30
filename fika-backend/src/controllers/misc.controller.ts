import type { RequestHandler } from 'express';
import { prisma } from '../config/prisma.js';
import { matchingSuggestions } from '../services/matching.service.js';
import { markAllNotificationsRead, markNotificationRead, listNotifications } from '../services/notification.service.js';
import { createRating } from '../services/rating.service.js';
import { createReport } from '../services/safety.service.js';
import { ApiError } from '../utils/api-error.js';
import { success } from '../utils/responses.js';

export const listConversationStartersController: RequestHandler = async (_request, response) => success(response, await prisma.conversationStarter.findMany({ orderBy: { createdAt: 'asc' } }));
export const randomConversationStarterController: RequestHandler = async (_request, response) => {
  const count = await prisma.conversationStarter.count();
  if (!count) throw new ApiError(404, 'No conversation starters are available', 'STARTER_NOT_FOUND');
  success(response, await prisma.conversationStarter.findFirstOrThrow({ skip: Math.floor(Math.random() * count) }));
};
export const matchingController: RequestHandler = async (request, response) => success(response, await matchingSuggestions(request.auth!.userId, request.query.type as never));
export const notificationsController: RequestHandler = async (request, response) => success(response, await listNotifications(request.auth!.userId));
export const markNotificationReadController: RequestHandler = async (request, response) => { const result = await markNotificationRead(request.auth!.userId, String(request.params.id)); if (!result.count) throw new ApiError(404, 'Notification not found', 'NOTIFICATION_NOT_FOUND'); success(response, null, 'Notification marked as read'); };
export const markAllNotificationsReadController: RequestHandler = async (request, response) => success(response, await markAllNotificationsRead(request.auth!.userId), 'Notifications marked as read');
export const ratingController: RequestHandler = async (request, response) => success(response, await createRating({ ...request.body, reviewerId: request.auth!.userId }), 'Rating submitted', 201);
export const reportController: RequestHandler = async (request, response) => success(response, await createReport(request.auth!.userId, request.body), 'Report submitted', 201);
