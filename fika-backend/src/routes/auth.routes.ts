import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { loginController, logoutController, meController, registerController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';
import { asyncHandler } from '../utils/async-handler.js';

export const authRouter = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Too many authentication attempts. Please try again later.', errorCode: 'RATE_LIMITED' } });

authRouter.post('/register', authLimiter, validate(registerSchema), asyncHandler(registerController));
authRouter.post('/login', authLimiter, validate(loginSchema), asyncHandler(loginController));
authRouter.post('/logout', logoutController);
authRouter.get('/me', authenticate, asyncHandler(meController));
