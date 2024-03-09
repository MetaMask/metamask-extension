import type { OnChainRawNotification } from '../types/on-chain-notification/on-chain-notification';
import type { Notification } from '../types/notification/notification';

export function processHalNotification(
  notification: OnChainRawNotification,
): Notification {
  return {
    ...notification,
    id: notification.id,
    createdAt: new Date(notification.created_at).toISOString(),
    isRead: !notification.unread,
  };
}
