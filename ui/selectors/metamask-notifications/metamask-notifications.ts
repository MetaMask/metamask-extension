// @ts-check
import { createSelector } from 'reselect';
import {
  NotificationServicesControllerState,
  INotification as Notification,
  TRIGGER_TYPES,
  defaultState,
} from '@metamask/notification-services-controller/notification-services';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import {
  getRemoteFeatureFlags,
  type RemoteFeatureFlagsState,
} from '../remote-feature-flags';

export type NotificationAppState = RemoteFeatureFlagsState & {
  metamask: Partial<NotificationServicesControllerState>;
};

const getMetamask = (state: NotificationAppState) => ({
  ...defaultState,
  ...state.metamask,
});

/**
 * Get the state of the `defiPositionsEnabled` remote feature flag.
 *
 * @param state
 * @returns The state of the `defiPositionsEnabled` remote feature flag.
 */
export function getIsNotificationEnabledByDefaultFeatureFlag(
  state: NotificationAppState,
) {
  const { assetsEnableNotificationsByDefaultV2 } = getRemoteFeatureFlags(state);
  const result =
    assetsEnableNotificationsByDefaultV2 &&
    typeof assetsEnableNotificationsByDefaultV2 === 'object' &&
    'value' in assetsEnableNotificationsByDefaultV2 &&
    Boolean(assetsEnableNotificationsByDefaultV2.value);

  return Boolean(result);
}

/**
 * Selector to get the list of MetaMask notifications.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {Notification[]} An array of notifications.
 */
export const getMetamaskNotifications = createSelector(
  [getMetamask],
  (metamask): Notification[] => {
    return metamask.metamaskNotificationsList;
  },
);

/**
 * Factory function to create a selector that retrieves a specific MetaMask notification by ID.
 *
 * This function returns a selector that is tailored to fetch a notification by its ID.
 *
 * @param id - The ID of the notification to retrieve.
 * @returns A selector function that takes the AppState and returns the notification.
 */
export const getMetamaskNotificationById = (id: string) => {
  return createDeepEqualSelector(
    [getMetamaskNotifications],
    (notifications: Notification[]): Notification | undefined => {
      return notifications.find((notification) => notification.id === id);
    },
  );
};

/**
 * Selector to get the count of unread feature announcement notifications.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {number} The count of unread feature announcement notifications.
 */
export const getFeatureAnnouncementsUnreadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]): number => {
    return notifications
      ? notifications.filter(
          (notification) =>
            !notification.isRead &&
            notification.type === TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
        ).length
      : 0;
  },
);

/**
 * Selector to get the count of read feature announcement notifications.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {number} The count of read feature announcement notifications.
 */
export const getFeatureAnnouncementsReadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]) => {
    return notifications
      ? notifications.filter(
          (notification) =>
            notification.isRead &&
            notification.type === TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
        ).length
      : 0;
  },
);

/**
 * Selector to get the count of unread snap notifications.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {number} The count of unread snap notifications.
 */
export const getSnapNotificationsUnreadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]): number => {
    return notifications
      ? notifications.filter(
          (notification) =>
            !notification.isRead && notification.type === TRIGGER_TYPES.SNAP,
        ).length
      : 0;
  },
);

/**
 * Selector to get the count of read snap notifications.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {number} The count of read snap notifications.
 */
export const getSnapNotificationsReadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]) => {
    return notifications
      ? notifications.filter(
          (notification) =>
            notification.isRead && notification.type === TRIGGER_TYPES.SNAP,
        ).length
      : 0;
  },
);

/**
 * Selector to get the count of unread non-feature announcement notifications.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {number} The count of unread non-feature announcement notifications.
 */
export const getOnChainMetamaskNotificationsUnreadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]): number => {
    return notifications
      ? notifications.filter(
          (notification) =>
            !notification.isRead &&
            notification.type !== TRIGGER_TYPES.FEATURES_ANNOUNCEMENT &&
            notification.type !== TRIGGER_TYPES.SNAP,
        ).length
      : 0;
  },
);

/**
 * Selector to get the count of read non-feature announcement notifications.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {number} The count of read non-feature announcement notifications.
 */
export const getOnChainMetamaskNotificationsReadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]): number => {
    return notifications
      ? notifications.filter(
          (notification) =>
            notification.isRead &&
            notification.type !== TRIGGER_TYPES.FEATURES_ANNOUNCEMENT &&
            notification.type !== TRIGGER_TYPES.SNAP,
        ).length
      : 0;
  },
);

/**
 * Selector to determine if the MetaMask notifications feature has been seen by the user.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if the MetaMask notifications feature has been seen, false otherwise.
 */
export const selectIsMetamaskNotificationsFeatureSeen = createSelector(
  [getMetamask],
  (metamask) => metamask.isMetamaskNotificationsFeatureSeen,
);

/**
 * Selector to determine if MetaMask notifications are enabled.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if MetaMask notifications are enabled, false otherwise.
 */
export const selectIsMetamaskNotificationsEnabled = createSelector(
  [getMetamask],
  (metamask): boolean => metamask.isNotificationServicesEnabled,
);

/**
 * Selector to determine if feature announcements are enabled.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if feature announcements are enabled, false otherwise.
 */
export const selectIsFeatureAnnouncementsEnabled = createSelector(
  [getMetamask],
  (metamask): boolean => metamask.isFeatureAnnouncementsEnabled,
);

/**
 * Selector to determine if MetaMask notifications are currently being created.
 *
 * This selector checks the `isUpdatingMetamaskNotifications` property of the `metamask` state to see if the notifications are in the process of being created.
 * It uses the `createSelector` function from 'reselect' for memoization, improving performance by avoiding unnecessary recalculations.
 *
 * @param state - The current state of the Redux store.
 * @returns Returns true if MetaMask notifications are being created, false otherwise.
 */
export const getIsUpdatingMetamaskNotifications = createSelector(
  [getMetamask],
  (metamask): boolean => metamask.isUpdatingMetamaskNotifications,
);

/**
 * Selector to determine if the MetaMask notifications account is currently being updated.
 *
 * This selector checks the `isUpdatingMetamaskNotificationsAccount` property of the `metamask` state to see if the account associated with MetaMask notifications is in the process of being updated.
 * It uses the `createSelector` function from 'reselect' for memoization, improving performance by avoiding unnecessary recalculations.
 *
 * @param {NotificationAppState} state - The current state of the Redux store.
 * @returns {string[]} Returns list of accounts that are currently being updated.
 */
export const getIsUpdatingMetamaskNotificationsAccount = createSelector(
  [getMetamask],
  (metamask): string[] => {
    return metamask.isUpdatingMetamaskNotificationsAccount;
  },
);

export const getValidNotificationAccounts = createSelector(
  [getMetamask],
  (metamask): string[] => metamask.subscriptionAccountsSeen,
);
