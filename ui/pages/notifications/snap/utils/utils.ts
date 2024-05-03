import type {
  RawSnapNotification,
  SnapNotificationWithoutSnapName,
} from '../types/types';
import { SNAP } from '../types/types';

export const processSnapNotifications = (
  snapNotifications: RawSnapNotification[],
): SnapNotificationWithoutSnapName[] => {
  const snaps = snapNotifications.map((snapNotification) => {
    return {
      id: snapNotification.id,
      createdAt: new Date(snapNotification.createdDate * 1000).toISOString(),
      isRead: Boolean(snapNotification.readDate),
      type: SNAP,
      data: {
        message: snapNotification.message,
        origin: snapNotification.origin,
      },
    };
  });
  return snaps;
};
