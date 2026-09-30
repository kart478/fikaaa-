import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { z } from 'zod';
import { env } from '../config/env.js';
import { assertActiveParticipant, getParticipants } from '../services/fika.service.js';
import { createMessage } from '../services/message.service.js';
import { createNotification } from '../services/notification.service.js';
import { ApiError } from '../utils/api-error.js';
import { COOKIE_NAME, verifyToken } from '../utils/auth.js';

type AuthenticatedSocket = Socket & { data: { userId: string } };
const roomSchema = z.object({ fikaId: z.string().cuid() });
const messageSchema = roomSchema.extend({ content: z.string().trim().min(1).max(1000) });

function cookieValue(header: string | undefined, name: string) {
  return header?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

function roomName(fikaId: string) { return `fika:${fikaId}`; }

function emitSocketError(socket: Socket, error: unknown) {
  if (error instanceof ApiError) return socket.emit('fika_error', { message: error.message, errorCode: error.errorCode });
  socket.emit('fika_error', { message: 'Unable to complete that room action', errorCode: 'SOCKET_ACTION_FAILED' });
}

export function attachSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, { cors: { origin: env.CLIENT_URL, credentials: true } });

  io.use((socket, next) => {
    try {
      const token = cookieValue(socket.handshake.headers.cookie, COOKIE_NAME);
      if (!token) return next(new Error('Authentication required'));
      socket.data.userId = verifyToken(decodeURIComponent(token)).userId;
      next();
    } catch { next(new Error('Invalid session')); }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    socket.on('join_fika_room', async (payload: unknown) => {
      try {
        const { fikaId } = roomSchema.parse(payload);
        await assertActiveParticipant(fikaId, socket.data.userId);
        await socket.join(roomName(fikaId));
        socket.emit('joined_fika_room', { fikaId });
      } catch (error) { emitSocketError(socket, error); }
    });

    socket.on('leave_fika_room', async (payload: unknown) => {
      try {
        const { fikaId } = roomSchema.parse(payload);
        await socket.leave(roomName(fikaId));
        socket.emit('left_fika_room', { fikaId });
      } catch (error) { emitSocketError(socket, error); }
    });

    socket.on('send_message', async (payload: unknown) => {
      try {
        const { fikaId, content } = messageSchema.parse(payload);
        const message = await createMessage(fikaId, socket.data.userId, content);
        io.to(roomName(fikaId)).emit('new_message', message);
        const participants = await getParticipants(fikaId);
        void Promise.all(participants.filter((participant) => participant.userId !== socket.data.userId).map((participant) => createNotification({ userId: participant.userId, type: 'NEW_MESSAGE', title: 'New Fika room message', message: 'There is a new message in your Fika room.' })));
      } catch (error) { emitSocketError(socket, error); }
    });

    for (const eventName of ['typing_start', 'typing_stop'] as const) {
      socket.on(eventName, async (payload: unknown) => {
        try {
          const { fikaId } = roomSchema.parse(payload);
          await assertActiveParticipant(fikaId, socket.data.userId);
          socket.to(roomName(fikaId)).emit(eventName, { fikaId, userId: socket.data.userId });
        } catch (error) { emitSocketError(socket, error); }
      });
    }
  });
  return io;
}
