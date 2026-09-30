import type { RequestHandler } from 'express';
import { cancelFika, createFika, getFika, getParticipants, joinFika, leaveFika, listFikas, updateFika } from '../services/fika.service.js';
import { listMessages } from '../services/message.service.js';
import { success } from '../utils/responses.js';

export const createFikaController: RequestHandler = async (request, response) => success(response, await createFika(request.auth!.userId, request.body), 'Fika created', 201);
export const listFikasController: RequestHandler = async (request, response) => success(response, await listFikas(request.query as never, request.auth?.userId));
export const getFikaController: RequestHandler = async (request, response) => success(response, await getFika(String(request.params.id), request.auth?.userId));
export const updateFikaController: RequestHandler = async (request, response) => success(response, await updateFika(request.auth!.userId, String(request.params.id), request.body), 'Fika updated');
export const cancelFikaController: RequestHandler = async (request, response) => success(response, await cancelFika(request.auth!.userId, String(request.params.id)), 'Fika cancelled');
export const joinFikaController: RequestHandler = async (request, response) => success(response, await joinFika(String(request.params.id), request.auth!.userId), 'You joined this Fika', 201);
export const leaveFikaController: RequestHandler = async (request, response) => success(response, await leaveFika(String(request.params.id), request.auth!.userId), 'You left this Fika');
export const participantsController: RequestHandler = async (request, response) => success(response, await getParticipants(String(request.params.id)));
export const messagesController: RequestHandler = async (request, response) => success(response, await listMessages(String(request.params.fikaId), request.auth!.userId, Number(request.query.page), Number(request.query.limit)));
