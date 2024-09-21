import type { RawSnapNotification, SnapNotification } from '../types/types';
import { SNAP } from '../types/types';

export const processSnapNotifications = (
  snapNotifications: RawSnapNotification[],
): SnapNotification[] => {
  const snaps = snapNotifications.map((snapNotification): SnapNotification => {
    return {
      id: snapNotification.id,
      createdAt: new Date(snapNotification.createdDate).toISOString(),
      isRead: Boolean(snapNotification.readDate),
      type: SNAP,
      data: snapNotification,
    };
  });
  return snaps;
};
