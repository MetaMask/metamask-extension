import type { FeatureAnnouncementRawNotification } from '../types/feature-announcement/feature-announcement';
import type { Notification } from '../types/notification/notification';

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

function isThirtyDaysOld(oldDate: Date) {
  const differenceInTime = Date.now() - oldDate.getTime();
  const differenceInDays = differenceInTime / ONE_DAY_MS;
  return differenceInDays >= 30;
}

export function isFeatureAnnouncementRead(
  notification: Pick<Notification, 'id' | 'createdAt'>,
  readPlatformNotificationsList: string[],
): boolean {
  if (readPlatformNotificationsList.includes(notification.id)) {
    return true;
  }
  return isThirtyDaysOld(new Date(notification.createdAt));
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
