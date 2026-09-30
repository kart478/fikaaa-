import { Router } from 'express';
import { listConversationStartersController, markAllNotificationsReadController, markNotificationReadController, matchingController, notificationsController, randomConversationStarterController, ratingController, reportController } from '../controllers/misc.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { fikaTypes } from '../schemas/fika.schema.js';
import { ratingSchema, reportSchema } from '../schemas/safety.schema.js';
import { userIdParams } from '../schemas/user.schema.js';
import { asyncHandler } from '../utils/async-handler.js';
import { z } from 'zod';

export const conversationStarterRouter = Router();
conversationStarterRouter.get('/', asyncHandler(listConversationStartersController));
conversationStarterRouter.get('/random', asyncHandler(randomConversationStarterController));

export const matchingRouter = Router();
matchingRouter.get('/suggestions', authenticate, validate(z.object({ body: z.object({}), params: z.object({}), query: z.object({ type: z.enum(fikaTypes).optional() }) })), asyncHandler(matchingController));

export const notificationRouter = Router();
notificationRouter.get('/', authenticate, asyncHandler(notificationsController));
notificationRouter.put('/read-all', authenticate, asyncHandler(markAllNotificationsReadController));
notificationRouter.put('/:id/read', authenticate, validate(userIdParams), asyncHandler(markNotificationReadController));

export const ratingRouter = Router();
ratingRouter.post('/', authenticate, validate(ratingSchema), asyncHandler(ratingController));

export const reportRouter = Router();
reportRouter.post('/', authenticate, validate(reportSchema), asyncHandler(reportController));
