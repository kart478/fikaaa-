import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error-handler.js';
import { authRouter } from './routes/auth.routes.js';
import { conversationStarterRouter, matchingRouter, notificationRouter, ratingRouter, reportRouter } from './routes/misc.routes.js';
import { fikaRouter } from './routes/fika.routes.js';
import { interestRouter } from './routes/interest.routes.js';
import { userRouter } from './routes/user.routes.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.get('/health', (_request, response) => response.status(200).json({ success: true, data: { status: 'ok' } }));
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/interests', interestRouter);
  app.use('/api/fikas', fikaRouter);
  app.use('/api/conversation-starters', conversationStarterRouter);
  app.use('/api/matching', matchingRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/ratings', ratingRouter);
  app.use('/api/reports', reportRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
