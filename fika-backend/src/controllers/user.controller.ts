import type { RequestHandler } from 'express';
import { addMyInterests, blockUser, getBlockedUsers, getMyInterests, getPublicProfile, getUserFikaHistory, removeMyInterest, unblockUser, updateMyProfile } from '../services/user.service.js';
import { success } from '../utils/responses.js';

export const publicProfileController: RequestHandler = async (request, response) => success(response, await getPublicProfile(String(request.params.id)));
export const updateMeController: RequestHandler = async (request, response) => success(response, await updateMyProfile(request.auth!.userId, request.body), 'Profile updated');
export const myInterestsController: RequestHandler = async (request, response) => success(response, await getMyInterests(request.auth!.userId));
export const addMyInterestsController: RequestHandler = async (request, response) => success(response, await addMyInterests(request.auth!.userId, request.body.interestIds), 'Interests updated');
export const removeMyInterestController: RequestHandler = async (request, response) => { await removeMyInterest(request.auth!.userId, String(request.params.interestId)); success(response, null, 'Interest removed'); };
export const upcomingFikasController: RequestHandler = async (request, response) => success(response, await getUserFikaHistory(request.auth!.userId, false));
export const pastFikasController: RequestHandler = async (request, response) => success(response, await getUserFikaHistory(request.auth!.userId, true));
export const blockUserController: RequestHandler = async (request, response) => success(response, await blockUser(request.auth!.userId, String(request.params.id)), 'User blocked', 201);
export const unblockUserController: RequestHandler = async (request, response) => { await unblockUser(request.auth!.userId, String(request.params.id)); success(response, null, 'User unblocked'); };
export const blockedUsersController: RequestHandler = async (request, response) => success(response, await getBlockedUsers(request.auth!.userId));
