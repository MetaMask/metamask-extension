import type { FeatureAnnouncementRawNotification } from '../types/feature-announcement';
import type { Notification } from '../types/notification';

function isFeatureAnnouncementRead(
  notificationId: string,
  readPlatformNotificationsList: string[],
): boolean {
  return readPlatformNotificationsList.includes(notificationId);
}

export function processFeatureAnnouncement(
  notification: FeatureAnnouncementRawNotification,
  readPlatformNotificationsList: string[],
): Notification {
  return {
    type: notification.type,
    id: notification.data.id,
    createdAt: new Date(notification.createdAt).toISOString(),
    data: notification.data,
    isRead: isFeatureAnnouncementRead(
      notification.data.id,
      readPlatformNotificationsList,
    ),
  };
}
