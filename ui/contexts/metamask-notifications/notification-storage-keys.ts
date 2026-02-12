import {
  getStorageItem,
  setStorageItem,
} from '../../../shared/lib/storage-helpers';

/**
 * Used to track when/how often we should re-subscribe users to notifications.
 * It ensures that users notification subscriptions are kept up to date (in case our backend adds new support for certian notifications)
 * And ensures that any push notification subscriptions are up-to-date
 */
export const RESUBSCRIBE_NOTIFICATIONS_KEY = 'RESUBSCRIBE_NOTIFICATIONS_EXPIRY';
export const RESUBSCRIBE_NOTIFICATIONS_EXPIRY_DURATION_MS = 24 * 60 * 60 * 1000; // 1 day

export const hasNotificationSubscriptionExpired = async () => {
  const expiryTimestamp: string | undefined = await getStorageItem(
    RESUBSCRIBE_NOTIFICATIONS_KEY,
  );
  if (!expiryTimestamp) {
    return true;
  }
  const now = Date.now();
  return now > parseInt(expiryTimestamp, 10);
};

export const updateNotificationSubscriptionExpiration = async () => {
  const now = Date.now();
  const expiryTimestamp = now + RESUBSCRIBE_NOTIFICATIONS_EXPIRY_DURATION_MS;
  await setStorageItem(
    RESUBSCRIBE_NOTIFICATIONS_KEY,
    expiryTimestamp.toString(),
  );
};

/**
 * Tracks if a user has turned off notifications before
 * It ensures that we don't accidentally turn on notifications during our auto-enable notification effects (enable notifications by default)
 */
export const HAS_USER_TURNED_OFF_ONCE_NOTIFICATIONS_KEY =
  'NOTIFICATIONS_TURNED_OFF_ONCE';

export const hasUserTurnedOffNotificationsOnce = async () => {
  const hasTurnedOffOnce: string | undefined = await getStorageItem(
    HAS_USER_TURNED_OFF_ONCE_NOTIFICATIONS_KEY,
  );
  return Boolean(hasTurnedOffOnce);
};

export const setUserHasTurnedOffNotificationsOnce = async () => {
  await setStorageItem(HAS_USER_TURNED_OFF_ONCE_NOTIFICATIONS_KEY, true);
};
