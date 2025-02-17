import { createSelector } from 'reselect';
import { NotificationServicesController } from '@metamask/notification-services-controller';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';

const { TRIGGER_TYPES } = NotificationServicesController.Constants;

type Notification = NotificationServicesController.Types.INotification;

type AppState = {
  metamask: NotificationServicesController.NotificationServicesControllerState;
};

const getMetamask = (state: AppState) => state.metamask;

/**
 * Selector to get the list of MetaMask notifications.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {Notification[]} An array of notifications.
 */
export const getMetamaskNotifications = createSelector(
  [getMetamask],
  (metamask) => metamask.metamaskNotificationsList,
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
 * Selector to get the list of read MetaMask notifications.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {Notification[]} An array of notifications that have been read.
 */
export const getMetamaskNotificationsReadList = createSelector(
  [getMetamask],
  (metamask) => metamask.metamaskNotificationsReadList,
);

/**
 * Selector to get the count of unread MetaMask notifications.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {number} The count of notifications that have not been read.
 */
export const getMetamaskNotificationsUnreadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]) => {
    return notifications
      ? notifications.filter((notification) => !notification.isRead).length
      : 0;
  },
);

/**
 * Selector to get the count of unread feature announcement notifications.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {number} The count of unread feature announcement notifications.
 */
export const getFeatureAnnouncementsUnreadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]) => {
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
 * @param {AppState} state - The current state of the Redux store.
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
 * @param {AppState} state - The current state of the Redux store.
 * @returns {number} The count of unread snap notifications.
 */
export const getSnapNotificationsUnreadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]) => {
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
 * @param {AppState} state - The current state of the Redux store.
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
 * @param {AppState} state - The current state of the Redux store.
 * @returns {number} The count of unread non-feature announcement notifications.
 */
export const getOnChainMetamaskNotificationsUnreadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]) => {
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
 * @param {AppState} state - The current state of the Redux store.
 * @returns {number} The count of read non-feature announcement notifications.
 */
export const getOnChainMetamaskNotificationsReadCount = createSelector(
  [getMetamaskNotifications],
  (notifications: Notification[]) => {
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
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if the MetaMask notifications feature has been seen, false otherwise.
 */
export const selectIsMetamaskNotificationsFeatureSeen = createSelector(
  [getMetamask],
  (metamask) => metamask.isMetamaskNotificationsFeatureSeen,
);

/**
 * Selector to determine if MetaMask notifications are enabled.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if MetaMask notifications are enabled, false otherwise.
 */
export const selectIsMetamaskNotificationsEnabled = createSelector(
  [getMetamask],
  (metamask) => metamask.isNotificationServicesEnabled,
);

/**
 * Selector to determine if feature announcements are enabled.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if feature announcements are enabled, false otherwise.
 */
export const selectIsFeatureAnnouncementsEnabled = createSelector(
  [getMetamask],
  (metamask) => metamask.isFeatureAnnouncementsEnabled,
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
  (metamask) => metamask.isUpdatingMetamaskNotifications,
);

/**
 * Selector to determine if MetaMask notifications are currently being fetched.
 *
 * This selector accesses the `isFetchingMetamaskNotifications` property from the `metamask` state to check if the notifications are currently being fetched.
 * It leverages the `createSelector` function for memoization, which helps in optimizing the performance by caching the result until the input selectors' outputs change.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if MetaMask notifications are being fetched, false otherwise.
 */
export const isFetchingMetamaskNotifications = createSelector(
  [getMetamask],
  (metamask) => metamask.isFetchingMetamaskNotifications,
);

/**
 * Selector to determine if the MetaMask notifications account is currently being updated.
 *
 * This selector checks the `isUpdatingMetamaskNotificationsAccount` property of the `metamask` state to see if the account associated with MetaMask notifications is in the process of being updated.
 * It uses the `createSelector` function from 'reselect' for memoization, improving performance by avoiding unnecessary recalculations.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if the MetaMask notifications account is being updated, false otherwise.
 */
export const getIsUpdatingMetamaskNotificationsAccount = createSelector(
  [getMetamask],
  (metamask) => {
    return metamask.isUpdatingMetamaskNotificationsAccount;
  },
);

/**
 * Selector to determine if the presence of accounts is currently being checked.
 *
 * This selector accesses the `isCheckingAccountsPresence` property from the `metamask` state to check if the system is currently verifying the presence of accounts.
 * It leverages the `createSelector` function for memoization, which helps in optimizing performance by caching the result until the input selectors' outputs change.
 *
 * @param {AppState} state - The current state of the Redux store.
 * @returns {boolean} Returns true if the account presence check is ongoing, false otherwise.
 */
export const getIsCheckingAccountsPresence = createSelector(
  [getMetamask],
  (metamask) => metamask.isCheckingAccountsPresence,
);
