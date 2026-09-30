import type { RequestHandler } from 'express';
import { login, register } from '../services/auth.service.js';
import { clearSessionCookie, setSessionCookie } from '../utils/auth.js';
import { success } from '../utils/responses.js';

export const registerController: RequestHandler = async (request, response) => {
  const user = await register(request.body);
  setSessionCookie(response, user.id);
  success(response, user, 'Account created', 201);
};

export const loginController: RequestHandler = async (request, response) => {
  const user = await login(request.body.email, request.body.password);
  setSessionCookie(response, user.id);
  success(response, user, 'Logged in');
};

export const logoutController: RequestHandler = (_request, response) => {
  clearSessionCookie(response);
  success(response, null, 'Logged out');
};

export const meController: RequestHandler = async (request, response) => {
  const { getMe } = await import('../services/user.service.js');
  success(response, await getMe(request.auth!.userId));
};
