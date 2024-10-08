import { TRIGGER_TYPES } from '../../notification-components';
import type { RawSnapNotification, SnapNotification } from '../types/types';

export const processSnapNotifications = (
  snapNotifications: RawSnapNotification[],
): SnapNotification[] => {
  const snaps = snapNotifications.map((snapNotification): SnapNotification => {
    return {
      id: snapNotification.id,
      createdAt: new Date(snapNotification.createdDate).toISOString(),
      isRead: Boolean(snapNotification.readDate),
      type: TRIGGER_TYPES.SNAP,
      data: snapNotification,
    };
  });
  return snaps;
};
