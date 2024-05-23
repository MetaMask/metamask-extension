import type { Notification } from '../types/notification/notification';
import type { OnChainRawNotification } from '../types/on-chain-notification/on-chain-notification';
import type { FeatureAnnouncementRawNotification } from '../types/feature-announcement/feature-announcement';
import { TRIGGER_TYPES } from '../constants/notification-schema';
import { processOnChainNotification } from './process-onchain-notifications';
import {
  isFeatureAnnouncementRead,
  processFeatureAnnouncement,
} from './process-feature-announcement';

const isOnChainNotification = (
  n: OnChainRawNotification,
): n is OnChainRawNotification => Object.values(TRIGGER_TYPES).includes(n.type);

export function processNotification(
  notification: FeatureAnnouncementRawNotification | OnChainRawNotification,
  readNotifications: string[] = [],
): Notification {
  const exhaustedAllCases = (_: never) => {
    throw new Error(
      `No processor found for notification kind ${notification.type}`,
    );
  };

  if (notification.type === TRIGGER_TYPES.FEATURES_ANNOUNCEMENT) {
    const n = processFeatureAnnouncement(
      notification as FeatureAnnouncementRawNotification,
    );
    n.isRead = isFeatureAnnouncementRead(n, readNotifications);
    return n;
  }

  if (isOnChainNotification(notification as OnChainRawNotification)) {
    return processOnChainNotification(notification as OnChainRawNotification);
  }

  return exhaustedAllCases(notification as never);
}
