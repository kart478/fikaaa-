import type { NotificationType } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export async function createNotification(input: { userId: string; type: NotificationType; title: string; message: string }) {
  return prisma.notification.create({ data: input });
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { isRead: true } });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
}
