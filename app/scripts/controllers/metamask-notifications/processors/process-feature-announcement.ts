import type { FeatureAnnouncementRawNotification } from '../types/feature-announcement/feature-announcement';
import type { Notification } from '../types/notification/notification';

export function isFeatureAnnouncementRead(
  notificationId: string,
  readPlatformNotificationsList: string[],
): boolean {
  return readPlatformNotificationsList.includes(notificationId);
}

export function processFeatureAnnouncement(
  notification: FeatureAnnouncementRawNotification,
): Notification {
  return {
    type: notification.type,
    id: notification.data.id,
    createdAt: new Date(notification.createdAt).toISOString(),
    data: notification.data,
    isRead: false,
  };
}
