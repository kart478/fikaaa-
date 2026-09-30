import { Router } from 'express';
import { cancelFikaController, createFikaController, getFikaController, joinFikaController, leaveFikaController, listFikasController, messagesController, participantsController, updateFikaController } from '../controllers/fika.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { optionalAuthenticate } from '../middleware/optional-authenticate.js';
import { validate } from '../middleware/validate.js';
import { createFikaSchema, discoverFikasSchema, fikaIdParams, messagesSchema, updateFikaSchema } from '../schemas/fika.schema.js';
import { asyncHandler } from '../utils/async-handler.js';

export const fikaRouter = Router();
fikaRouter.post('/', authenticate, validate(createFikaSchema), asyncHandler(createFikaController));
fikaRouter.get('/', optionalAuthenticate, validate(discoverFikasSchema), asyncHandler(listFikasController));
fikaRouter.get('/:id', optionalAuthenticate, validate(fikaIdParams), asyncHandler(getFikaController));
fikaRouter.put('/:id', authenticate, validate(updateFikaSchema), asyncHandler(updateFikaController));
fikaRouter.delete('/:id', authenticate, validate(fikaIdParams), asyncHandler(cancelFikaController));
fikaRouter.post('/:id/join', authenticate, validate(fikaIdParams), asyncHandler(joinFikaController));
fikaRouter.post('/:id/leave', authenticate, validate(fikaIdParams), asyncHandler(leaveFikaController));
fikaRouter.get('/:id/participants', optionalAuthenticate, validate(fikaIdParams), asyncHandler(participantsController));
fikaRouter.get('/:fikaId/messages', authenticate, validate(messagesSchema), asyncHandler(messagesController));
