import { Router } from 'express';
import { getInterestController, listInterestsController } from '../controllers/interest.controller.js';
import { validate } from '../middleware/validate.js';
import { userIdParams } from '../schemas/user.schema.js';
import { asyncHandler } from '../utils/async-handler.js';

export const interestRouter = Router();
interestRouter.get('/', asyncHandler(listInterestsController));
interestRouter.get('/:id', validate(userIdParams), asyncHandler(getInterestController));
