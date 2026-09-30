import { Router } from 'express';
import { addMyInterestsController, blockedUsersController, blockUserController, myInterestsController, pastFikasController, publicProfileController, removeMyInterestController, unblockUserController, upcomingFikasController, updateMeController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { interestIdParams, interestMutationSchema, updateProfileSchema, userIdParams } from '../schemas/user.schema.js';
import { asyncHandler } from '../utils/async-handler.js';

export const userRouter = Router();

userRouter.get('/me/fikas/upcoming', authenticate, asyncHandler(upcomingFikasController));
userRouter.get('/me/fikas/past', authenticate, asyncHandler(pastFikasController));
userRouter.get('/me/interests', authenticate, asyncHandler(myInterestsController));
userRouter.post('/me/interests', authenticate, validate(interestMutationSchema), asyncHandler(addMyInterestsController));
userRouter.delete('/me/interests/:interestId', authenticate, validate(interestIdParams), asyncHandler(removeMyInterestController));
userRouter.get('/me/blocked', authenticate, asyncHandler(blockedUsersController));
userRouter.put('/me', authenticate, validate(updateProfileSchema), asyncHandler(updateMeController));
userRouter.post('/:id/block', authenticate, validate(userIdParams), asyncHandler(blockUserController));
userRouter.delete('/:id/block', authenticate, validate(userIdParams), asyncHandler(unblockUserController));
userRouter.get('/:id', validate(userIdParams), asyncHandler(publicProfileController));
